import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Card, createDeck } from './game';
import { GameState, GameStateService } from './game-state.service';
import { BLIND_TARGETS } from './game-state.service';

function startFirstBlind(game: GameStateService): void {
  game.startNewGame();
  game.startBlind();
}

function finishCurrentBlind(game: GameStateService): GameStateService {
  const saved = JSON.parse(localStorage.getItem('seme-e-stelle-save-v1')!) as {
    version: number;
    state: GameState;
  };
  localStorage.setItem(
    'seme-e-stelle-save-v1',
    JSON.stringify({
      ...saved,
      state: { ...game.state(), roundScore: game.state().target - 1, handsLeft: 2 },
    }),
  );
  const resumedGame = new GameStateService();
  resumedGame.toggleCard(resumedGame.state().hand[0].id);
  resumedGame.playSelectedCards();
  return resumedGame;
}

function createBossGame(
  ante: number,
  jokerIds: GameState['jokerIds'] = [],
  fixedHand: Card[] = [],
) {
  const game = TestBed.inject(GameStateService);
  game.startNewGame();
  localStorage.setItem(
    'seme-e-stelle-save-v1',
    JSON.stringify({
      version: 2,
      state: {
        ...game.state(),
        round: ante,
        blind: 2,
        target: BLIND_TARGETS[ante][2],
        jokerIds,
      },
    }),
  );
  const boss = new GameStateService();
  boss.startBlind();
  if (fixedHand.length === 0) return boss;

  const deck = createDeck();
  const fixedIds = new Set(fixedHand.map((card) => card.id));
  const hand = [
    ...fixedHand,
    ...deck.filter((card) => !fixedIds.has(card.id)).slice(0, 8 - fixedHand.length),
  ];
  const handIds = new Set(hand.map((card) => card.id));
  const playingState = {
    ...boss.state(),
    hand,
    drawPile: deck.filter((card) => !handIds.has(card.id)),
    discardPile: [],
  };
  localStorage.setItem(
    'seme-e-stelle-save-v1',
    JSON.stringify({ version: 2, state: playingState }),
  );
  return new GameStateService();
}

describe('GameStateService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [GameStateService] });
  });

  it('shows the ante overview before dealing eight unique cards', () => {
    const game = TestBed.inject(GameStateService);
    game.startNewGame();
    expect(game.state().phase).toBe('overview');
    expect(game.state().hand).toHaveLength(0);
    expect(game.state().drawPile).toHaveLength(52);

    game.startBlind();
    const state = game.state();
    expect(state.phase).toBe('playing');
    expect(state.round).toBe(1);
    expect(state.target).toBe(300);
    expect(state.hand).toHaveLength(8);
    expect(state.hand.map((card) => card.rank)).toEqual(
      [...state.hand].map((card) => card.rank).sort((a, b) => b - a),
    );
    expect(state.drawPile).toHaveLength(44);
    expect(new Set([...state.hand, ...state.drawPile].map((card) => card.id)).size).toBe(52);
  });

  it('requires each blind to be completed before the next one is unlocked', () => {
    const game = TestBed.inject(GameStateService);
    startFirstBlind(game);
    const nextBlind = finishCurrentBlind(game);

    expect(nextBlind.state().phase).toBe('overview');
    expect(nextBlind.state().blind).toBe(1);
    expect(nextBlind.state().target).toBe(450);
    expect(nextBlind.state().hand).toHaveLength(0);

    nextBlind.startBlind();
    expect(nextBlind.state().phase).toBe('playing');
    expect(nextBlind.state().target).toBe(450);
  });

  it('limits selection to five and replaces discarded cards', () => {
    const game = TestBed.inject(GameStateService);
    startFirstBlind(game);
    const firstHand = game.state().hand;

    for (const card of firstHand.slice(0, 6)) game.toggleCard(card.id);
    expect(game.state().selectedIds).toHaveLength(5);

    for (const card of firstHand.slice(0, 3)) game.toggleCard(card.id);
    game.discardSelectedCards();

    const state = game.state();
    expect(state.hand).toHaveLength(8);
    expect(state.hand.map((card) => card.rank)).toEqual(
      [...state.hand].map((card) => card.rank).sort((a, b) => b - a),
    );
    expect(state.discardsLeft).toBe(2);
    expect(state.discardPile).toHaveLength(2);
    expect(
      new Set([...state.hand, ...state.drawPile, ...state.discardPile].map((card) => card.id)).size,
    ).toBe(52);
  });

  it('restores the saved game after a new service instance is created', () => {
    const game = TestBed.inject(GameStateService);
    startFirstBlind(game);
    const originalHand = game.state().hand;
    const saved = JSON.parse(localStorage.getItem('seme-e-stelle-save-v1')!) as {
      version: number;
      state: GameState;
    };
    localStorage.setItem(
      'seme-e-stelle-save-v1',
      JSON.stringify({
        ...saved,
        state: { ...saved.state, hand: [...saved.state.hand].reverse() },
      }),
    );

    const restored = new GameStateService().state();
    expect(restored.phase).toBe('playing');
    expect(restored.hand).toEqual(originalHand);
    expect(restored.target).toBe(300);
  });

  it('migrates a saved shop from the previous game format', () => {
    const game = TestBed.inject(GameStateService);
    startFirstBlind(game);
    const { blind: _blind, ...legacyState } = game.state();
    localStorage.setItem(
      'seme-e-stelle-save-v1',
      JSON.stringify({
        version: 1,
        state: { ...legacyState, phase: 'shop', roundScore: 300, shopOffers: [] },
      }),
    );

    const restored = new GameStateService().state();
    expect(restored.phase).toBe('shop');
    expect(restored.blind).toBe(2);
    expect(restored.round).toBe(1);
  });

  it('opens the shop after reaching the target and resets resources for the next round', () => {
    const game = TestBed.inject(GameStateService);
    startFirstBlind(game);
    const largeBlind = finishCurrentBlind(game);
    expect(largeBlind.state().phase).toBe('overview');
    largeBlind.startBlind();
    const boss = finishCurrentBlind(largeBlind);
    expect(boss.state().phase).toBe('overview');
    boss.startBlind();
    const shop = finishCurrentBlind(boss);

    expect(shop.state().phase).toBe('shop');
    expect(shop.state().blind).toBe(2);
    expect(shop.state().shopOffers).toHaveLength(3);
    expect(shop.state().handsLeft).toBe(1);

    shop.continueToNextRound();
    expect(shop.state().phase).toBe('overview');
    expect(shop.state().round).toBe(2);
    expect(shop.state().target).toBe(600);
    expect(shop.state().roundScore).toBe(0);
    expect(shop.state().handsLeft).toBe(4);
    expect(shop.state().blind).toBe(0);
  });

  it('ends the game if the target is missed after the last hand', () => {
    const game = TestBed.inject(GameStateService);
    startFirstBlind(game);

    const saved = JSON.parse(localStorage.getItem('seme-e-stelle-save-v1')!) as {
      version: number;
      state: GameState;
    };
    localStorage.setItem(
      'seme-e-stelle-save-v1',
      JSON.stringify({
        ...saved,
        state: { ...saved.state, handsLeft: 1 },
      }),
    );
    const resumedGame = new GameStateService();
    resumedGame.toggleCard(resumedGame.state().hand[0].id);
    resumedGame.playSelectedCards();

    expect(resumedGame.state().phase).toBe('lost');
    expect(resumedGame.state().handsLeft).toBe(0);
  });

  it('applies the Michael Jackson face-card debuff during scoring', () => {
    const game = createBossGame(1, [], [{ id: 'hearts-14', rank: 14, suit: 'hearts' }]);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    game.toggleCard('hearts-14');
    game.playSelectedCards();

    expect(game.state().lastHandScore).toBe(5);
    vi.restoreAllMocks();
  });

  it('halves common hands during Il Leone', () => {
    const game = createBossGame(
      2,
      [],
      [
        { id: 'hearts-2', rank: 2, suit: 'hearts' },
        { id: 'spades-2', rank: 2, suit: 'spades' },
      ],
    );
    game.toggleCard('hearts-2');
    game.toggleCard('spades-2');
    game.playSelectedCards();

    expect(game.state().lastHandName).toBe('Coppia');
    expect(game.state().lastHandScore).toBe(14);
  });

  it('removes Stallone discards and charges for cards left unplayed', () => {
    const initialized = createBossGame(3);
    const state = initialized.state();
    expect(state.discardsLeft).toBe(0);
    const saved = JSON.parse(localStorage.getItem('seme-e-stelle-save-v1')!) as {
      version: number;
      state: GameState;
    };
    localStorage.setItem(
      'seme-e-stelle-save-v1',
      JSON.stringify({ ...saved, state: { ...state, money: 20 } }),
    );
    const boss = new GameStateService();
    boss.toggleCard(boss.state().hand[0].id);
    boss.playSelectedCards();

    expect(boss.state().discardsLeft).toBe(0);
    expect(boss.state().money).toBe(15);
  });

  it('reduces the hand size in Il Frociozzo Frocioso', () => {
    const game = createBossGame(6);
    const handSizeBoss = game.state();

    expect(handSizeBoss.hand).toHaveLength(6);
    expect(handSizeBoss.drawPile).toHaveLength(46);
  });

  it('disables the leftmost joker for Big bro and additive mult for Sigma Boy', () => {
    const kings = [
      { id: 'hearts-13', rank: 13, suit: 'hearts' } as const,
      { id: 'spades-13', rank: 13, suit: 'spades' } as const,
    ];
    const bigBro = createBossGame(4, ['lucky-coin'], [...kings]);
    bigBro.toggleCard('hearts-13');
    bigBro.toggleCard('spades-13');
    bigBro.playSelectedCards();

    const sigma = createBossGame(5, ['royal-spark'], [...kings]);
    sigma.toggleCard('hearts-13');
    sigma.toggleCard('spades-13');
    sigma.playSelectedCards();

    expect(bigBro.state().lastHandScore).toBe(60);
    expect(sigma.state().lastHandScore).toBe(60);
  });

  it('keeps distorted cards sorted and uses their temporary face for DOMANDINAAA', () => {
    const game = createBossGame(7);
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    game.toggleCard(game.state().hand[0].id);
    game.discardSelectedCards();

    const state = game.state();
    expect(Object.keys(state.distortedCards)).toHaveLength(1);
    expect(state.hand.map((card) => game.effectiveCard(card).rank)).toEqual(
      [...state.hand].map((card) => game.effectiveCard(card).rank).sort((a, b) => b - a),
    );
    vi.restoreAllMocks();
  });

  it('scales the Ante 8 goal and disables one joker for the Aura hand', () => {
    const game = createBossGame(
      8,
      ['lucky-coin', 'royal-spark'],
      [
        { id: 'hearts-13', rank: 13, suit: 'hearts' },
        { id: 'spades-13', rank: 13, suit: 'spades' },
      ],
    );
    expect(game.state().target).toBe(25000);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    game.toggleCard('hearts-13');
    game.toggleCard('spades-13');
    game.playSelectedCards();

    expect(game.state().lastHandScore).toBe(180);
    vi.restoreAllMocks();
  });
});
