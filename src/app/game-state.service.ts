import { Injectable, signal } from '@angular/core';
import {
  Card,
  createDeck,
  evaluateHand,
  JOKERS,
  JokerId,
  Rank,
  compareCardsByRank,
  sortCardsByRank,
  SUITS,
  Suit,
  shuffle,
} from './game';

export type GamePhase = 'ready' | 'overview' | 'playing' | 'shop' | 'won' | 'lost';
export type BossId =
  | 'king-of-pop'
  | 'lion'
  | 'stallion'
  | 'big-bro'
  | 'sigma-boy'
  | 'pannoso'
  | 'domandinAAA'
  | 'aura-suprema';

export interface CardFace {
  rank: Rank;
  suit: Suit;
}

export interface BossDefinition {
  id: BossId;
  name: string;
  description: string;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  blind: number;
  distortedCards: Record<string, CardFace>;
  target: number;
  roundScore: number;
  handsLeft: number;
  discardsLeft: number;
  money: number;
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  selectedIds: string[];
  jokerIds: JokerId[];
  shopOffers: JokerId[];
  announcement: string;
  lastHandName: string;
  lastHandScore: number;
}

const SAVE_KEY = 'seme-e-stelle-save-v1';
export const BLIND_NAMES = ['Piccolo buio', 'Grande buio', 'Boss'] as const;
const AURA_SCORE_MULTIPLIER = 2.5;
export const BLIND_TARGETS: Record<number, readonly [number, number, number]> = {
  1: [300, 450, 600],
  2: [600, 900, 1200],
  3: [1000, 1500, 2000],
  4: [1500, 2250, 3000],
  5: [2500, 3750, 5000],
  6: [4000, 6000, 8000],
  7: [6000, 9000, 12000],
  8: [10000, 15000, 10000 * AURA_SCORE_MULTIPLIER],
};
export const BOSS_DEFINITIONS: Record<number, BossDefinition> = {
  1: {
    id: 'king-of-pop',
    name: 'Michael Jackson',
    description: 'Jack, Regina, Re e Assi giocati hanno il 50% di probabilità di non fare punti.',
  },
  2: {
    id: 'lion',
    name: 'Il Leone',
    description: 'Il punteggio totale di Coppia, Doppia coppia e Tris è dimezzato.',
  },
  3: {
    id: 'stallion',
    name: 'Lo Stallone Kirkificato',
    description: 'Nessuno scarto disponibile. Ogni mano costa $1 per carta non giocata.',
  },
  4: {
    id: 'big-bro',
    name: 'Big bro',
    description: 'Il primo Jolly della collezione è disattivato per tutto il boss.',
  },
  5: {
    id: 'sigma-boy',
    name: 'Hamburgerona',
    description: 'I bonus additivi al moltiplicatore dei Jolly sono disattivati.',
  },
  6: {
    id: 'pannoso',
    name: 'Il Frociozzo Frocioso',
    description:
      'La mano contiene due carte in meno. Le carte consumabili non sono previste in questa versione.',
  },
  7: {
    id: 'domandinAAA',
    name: 'DOMANDINAAA',
    description:
      'Dopo ogni azione una carta cambia casualmente valore o seme fino alla fine del boss.',
  },
  8: {
    id: 'aura-suprema',
    name: "L'Aura Suprema",
    description:
      'Obiettivo moltiplicato per 2,5; a ogni mano un Jolly casuale è disattivato per quello scoring.',
  },
};
const INITIAL_HAND_SIZE = 8;
const HANDS_PER_ROUND = 4;
const DISCARDS_PER_ROUND = 3;
const MAX_JOKERS = 5;

function emptyGame(): GameState {
  return {
    phase: 'ready',
    round: 0,
    blind: 0,
    distortedCards: {},
    target: 0,
    roundScore: 0,
    handsLeft: 0,
    discardsLeft: 0,
    money: 4,
    hand: [],
    drawPile: [],
    discardPile: [],
    selectedIds: [],
    jokerIds: [],
    shopOffers: [],
    announcement: 'Premi “Inizia una nuova partita” per distribuire le carte.',
    lastHandName: '',
    lastHandScore: 0,
  };
}

function drawCards(
  count: number,
  drawPile: Card[],
  discardPile: Card[],
): { drawn: Card[]; drawPile: Card[]; discardPile: Card[] } {
  const nextDrawPile = [...drawPile];
  let nextDiscardPile = [...discardPile];
  const drawn: Card[] = [];

  while (drawn.length < count) {
    if (nextDrawPile.length === 0) {
      if (nextDiscardPile.length === 0) break;
      nextDrawPile.push(...shuffle(nextDiscardPile));
      nextDiscardPile = [];
    }
    const nextCard = nextDrawPile.pop();
    if (!nextCard) break;
    drawn.push(nextCard);
  }

  return { drawn, drawPile: nextDrawPile, discardPile: nextDiscardPile };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCard(value: unknown): value is Card {
  if (!isRecord(value)) return false;
  const { id, rank, suit } = value;
  return (
    typeof id === 'string' &&
    typeof rank === 'number' &&
    Number.isInteger(rank) &&
    rank >= 2 &&
    rank <= 14 &&
    typeof suit === 'string' &&
    SUITS.includes(suit as Suit) &&
    id === `${suit}-${rank}`
  );
}

function isJokerId(value: unknown): value is JokerId {
  return JOKERS.some((joker) => joker.id === value);
}

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;

  const hand = value['hand'];
  const drawPile = value['drawPile'];
  const discardPile = value['discardPile'];
  const selectedIds = value['selectedIds'];
  const jokerIds = value['jokerIds'];
  const shopOffers = value['shopOffers'];
  const distortedCards = value['distortedCards'] ?? {};
  const phases: GamePhase[] = ['ready', 'overview', 'playing', 'shop', 'won', 'lost'];
  if (
    !phases.includes(value['phase'] as GamePhase) ||
    !Array.isArray(hand) ||
    !hand.every(isCard) ||
    !Array.isArray(drawPile) ||
    !drawPile.every(isCard) ||
    !Array.isArray(discardPile) ||
    !discardPile.every(isCard) ||
    !Array.isArray(selectedIds) ||
    !selectedIds.every((id) => typeof id === 'string') ||
    !Array.isArray(jokerIds) ||
    !jokerIds.every(isJokerId) ||
    !Array.isArray(shopOffers) ||
    !shopOffers.every(isJokerId) ||
    !isRecord(distortedCards) ||
    !Object.entries(distortedCards).every(
      ([id, face]) =>
        hand.some((card) => card.id === id) &&
        isRecord(face) &&
        typeof face['rank'] === 'number' &&
        Number.isInteger(face['rank']) &&
        face['rank'] >= 2 &&
        face['rank'] <= 14 &&
        typeof face['suit'] === 'string' &&
        SUITS.includes(face['suit'] as Suit),
    ) ||
    typeof value['announcement'] !== 'string' ||
    typeof value['lastHandName'] !== 'string' ||
    typeof value['lastHandScore'] !== 'number' ||
    !Number.isInteger(value['lastHandScore']) ||
    typeof value['phase'] !== 'string' ||
    (value['blind'] !== undefined &&
      (typeof value['blind'] !== 'number' ||
        !Number.isInteger(value['blind']) ||
        value['blind'] < 0 ||
        value['blind'] > 2))
  ) {
    return false;
  }

  const { phase, round, target, roundScore, handsLeft, discardsLeft, money } = value;
  const blind = value['blind'] ?? 0;
  if (
    typeof round !== 'number' ||
    typeof target !== 'number' ||
    typeof roundScore !== 'number' ||
    typeof handsLeft !== 'number' ||
    typeof discardsLeft !== 'number' ||
    typeof money !== 'number' ||
    ![round, target, roundScore, handsLeft, discardsLeft, money].every(Number.isInteger) ||
    roundScore < 0 ||
    money < 0 ||
    hand.length > INITIAL_HAND_SIZE ||
    selectedIds.length > 5 ||
    new Set(selectedIds).size !== selectedIds.length ||
    new Set(jokerIds).size !== jokerIds.length ||
    jokerIds.length > MAX_JOKERS ||
    new Set(shopOffers).size !== shopOffers.length ||
    selectedIds.some((id) => !hand.some((card) => card.id === id))
  ) {
    return false;
  }

  if (phase === 'ready') return round === 0 && hand.length === 0;
  if (
    round < 1 ||
    round > 8 ||
    !BLIND_TARGETS[round].includes(target) ||
    (phase === 'overview' && (hand.length !== 0 || blind > 2)) ||
    (phase === 'shop' && value['blind'] !== undefined && blind !== 2)
  )
    return false;

  const cards = [...hand, ...drawPile, ...discardPile];
  return (
    cards.length === 52 &&
    new Set(cards.map((card) => card.id)).size === 52 &&
    handsLeft >= 0 &&
    handsLeft <= HANDS_PER_ROUND &&
    discardsLeft >= 0 &&
    discardsLeft <= DISCARDS_PER_ROUND
  );
}

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly currentState = signal<GameState>(emptyGame());
  readonly state = this.currentState.asReadonly();
  readonly storageNotice = signal('');

  constructor() {
    this.restore();
  }

  startNewGame(): void {
    this.update({
      ...emptyGame(),
      phase: 'overview',
      round: 1,
      target: BLIND_TARGETS[1][0],
      handsLeft: HANDS_PER_ROUND,
      discardsLeft: DISCARDS_PER_ROUND,
      drawPile: shuffle(createDeck()),
      announcement:
        'Ante 1. Piccolo buio: obiettivo 300 punti. Consulta i prossimi bui e premi Gioca per iniziare.',
    });
  }

  startBlind(): void {
    const state = this.currentState();
    if (state.phase !== 'overview' || state.blind > 2) return;

    const deck = state.drawPile.length === 52 ? state.drawPile : shuffle(createDeck());
    const handSize = this.handSizeFor(state.round, state.blind);
    const deal = drawCards(handSize, deck, []);
    const target = BLIND_TARGETS[state.round][state.blind];
    this.update({
      ...state,
      phase: 'playing',
      target,
      roundScore: 0,
      handsLeft: HANDS_PER_ROUND,
      discardsLeft:
        state.blind === 2 && BOSS_DEFINITIONS[state.round].id === 'stallion'
          ? 0
          : DISCARDS_PER_ROUND,
      hand: sortCardsByRank(deal.drawn),
      drawPile: deal.drawPile,
      discardPile: [],
      selectedIds: [],
      distortedCards: {},
      lastHandName: '',
      lastHandScore: 0,
      announcement: `Ante ${state.round}, ${BLIND_NAMES[state.blind]}. Obiettivo ${BLIND_TARGETS[state.round][state.blind]} punti. Scegli da una a cinque carte.`,
    });
  }

  toggleCard(cardId: string): void {
    const state = this.currentState();
    if (state.phase !== 'playing' || !state.hand.some((card) => card.id === cardId)) return;

    const selected = new Set(state.selectedIds);
    let announcement = state.announcement;

    if (selected.has(cardId)) {
      selected.delete(cardId);
    } else if (selected.size === 5) {
      announcement = 'Puoi selezionare al massimo cinque carte.';
    } else {
      selected.add(cardId);
    }

    this.update({ ...state, selectedIds: [...selected], announcement });
  }

  playSelectedCards(): void {
    const state = this.currentState();
    if (state.phase !== 'playing') return;
    if (state.selectedIds.length === 0 || state.selectedIds.length > 5) {
      this.announce('Seleziona da una a cinque carte da giocare.');
      return;
    }

    const selectedSet = new Set(state.selectedIds);
    const playedCards = state.hand
      .filter((card) => selectedSet.has(card.id))
      .map((card) => this.effectiveCard(card, state.distortedCards));
    const boss = this.currentBoss(state);
    const disabledCardIds =
      boss?.id === 'king-of-pop'
        ? playedCards
            .filter((card) => card.rank >= 11)
            .filter(() => Math.random() < 0.5)
            .map((card) => card.id)
        : [];
    const disabledJokerIds: JokerId[] = [];
    if (boss?.id === 'big-bro' && state.jokerIds[0]) disabledJokerIds.push(state.jokerIds[0]);
    if (boss?.id === 'sigma-boy' && state.jokerIds.includes('royal-spark')) {
      disabledJokerIds.push('royal-spark');
    }
    if (boss?.id === 'aura-suprema' && state.jokerIds.length > 0) {
      disabledJokerIds.push(state.jokerIds[Math.floor(Math.random() * state.jokerIds.length)]);
    }
    const result = evaluateHand(playedCards, state.jokerIds, {
      disabledCardIds,
      disabledJokerIds,
      scoreMultiplier:
        boss?.id === 'lion' &&
        (this.evaluateKind(playedCards) === 'pair' ||
          this.evaluateKind(playedCards) === 'two-pair' ||
          this.evaluateKind(playedCards) === 'three-kind')
          ? 0.5
          : 1,
    });
    const handsLeft = state.handsLeft - 1;
    const roundScore = state.roundScore + result.score;
    const unplayedCards = state.hand.filter((card) => !selectedSet.has(card.id));
    const stallionFee = boss?.id === 'stallion' ? unplayedCards.length : 0;
    const replenished = drawCards(
      this.handSizeFor(state.round, state.blind) - unplayedCards.length,
      state.drawPile,
      [...state.discardPile, ...state.hand.filter((card) => selectedSet.has(card.id))],
    );
    let hand = this.sortByFace([...unplayedCards, ...replenished.drawn], state.distortedCards);
    const handEarnings = 2;
    const winnings = roundScore >= state.target ? 3 + handsLeft : 0;
    const money = Math.max(0, state.money + handEarnings + winnings - stallionFee);
    const pointsMissing = Math.max(0, state.target - roundScore);
    let announcement =
      pointsMissing === 0
        ? `${result.name}: ${result.score} punti. Punti mancanti: 0. Obiettivo raggiunto! Hai guadagnato ${handEarnings + winnings} dollari.`
        : `${result.name}: ${result.score} punti. Te ne mancano ${pointsMissing} per l'obiettivo. Hai guadagnato ${handEarnings} dollari.`;
    if (disabledCardIds.length > 0) {
      announcement += ` Michael Jackson ha girato ${disabledCardIds.length} carte a faccia in giù.`;
    }
    if (boss?.id === 'stallion' && stallionFee > 0) {
      announcement += ` Costo del boss: -${stallionFee} dollari per le carte non giocate.`;
    }
    if (boss?.id === 'aura-suprema' && disabledJokerIds.length > 0) {
      const jokerName = JOKERS.find((joker) => joker.id === disabledJokerIds[0])?.name;
      if (jokerName) announcement += ` L'Aura disattiva ${jokerName} per questa mano.`;
    }

    let phase: GamePhase = 'playing';
    const round = state.round;
    let blind = state.blind;
    let target = state.target;
    let nextRoundScore = roundScore;
    let nextHandsLeft = handsLeft;
    let nextDiscardsLeft = state.discardsLeft;
    let nextHand = hand;
    let nextDrawPile = replenished.drawPile;
    let nextDiscardPile = replenished.discardPile;
    let shopOffers = state.shopOffers;
    let distortedCards = { ...state.distortedCards };
    let finalAnnouncement = announcement;

    if (roundScore >= state.target) {
      if (state.blind < 2) {
        phase = 'overview';
        blind = state.blind + 1;
        target = BLIND_TARGETS[state.round][blind];
        nextRoundScore = 0;
        nextHandsLeft = HANDS_PER_ROUND;
        nextDiscardsLeft = DISCARDS_PER_ROUND;
        nextHand = [];
        nextDrawPile = shuffle(createDeck());
        nextDiscardPile = [];
        finalAnnouncement = `${announcement} Prossimo: ${BLIND_NAMES[blind]}, obiettivo ${target}.`;
      } else if (state.round === 8) {
        phase = 'won';
        finalAnnouncement = `${announcement} Hai completato tutte e otto le ante!`;
      } else {
        phase = 'shop';
        shopOffers = this.createShopOffers(state.jokerIds);
      }
    } else if (handsLeft === 0) {
      phase = 'lost';
      finalAnnouncement = `${announcement} Le mani sono finite: partita conclusa.`;
    }

    if (boss?.id === 'domandinAAA' && phase === 'playing') {
      distortedCards = this.keepFacesForHand(distortedCards, hand);
      distortedCards = this.distortRandomHandCard(hand, distortedCards);
      hand = this.sortByFace(hand, distortedCards);
    } else if (phase !== 'playing') {
      distortedCards = {};
    } else {
      distortedCards = this.keepFacesForHand(distortedCards, hand);
    }
    nextHand = phase === 'overview' ? [] : hand;

    this.update({
      ...state,
      phase,
      round,
      blind,
      target,
      roundScore: nextRoundScore,
      handsLeft: nextHandsLeft,
      discardsLeft: nextDiscardsLeft,
      money,
      hand: nextHand,
      drawPile: nextDrawPile,
      discardPile: nextDiscardPile,
      distortedCards,
      selectedIds: [],
      shopOffers,
      announcement: finalAnnouncement,
      lastHandName: result.name,
      lastHandScore: result.score,
    });
  }

  discardSelectedCards(): void {
    const state = this.currentState();
    if (state.phase !== 'playing') return;
    if (state.selectedIds.length === 0 || state.selectedIds.length > 5) {
      this.announce('Seleziona da una a cinque carte da scartare.');
      return;
    }
    if (state.discardsLeft === 0) {
      this.announce('Non hai più scarti in questa anta.');
      return;
    }

    const selectedSet = new Set(state.selectedIds);
    const discardedCards = state.hand.filter((card) => selectedSet.has(card.id));
    const replenished = drawCards(discardedCards.length, state.drawPile, [
      ...state.discardPile,
      ...discardedCards,
    ]);

    let distortedCards = this.keepFacesForHand(
      { ...state.distortedCards },
      state.hand.filter((card) => !selectedSet.has(card.id)).concat(replenished.drawn),
    );
    const hand = this.sortByFace(
      [...state.hand.filter((card) => !selectedSet.has(card.id)), ...replenished.drawn],
      distortedCards,
    );
    if (this.currentBoss(state)?.id === 'domandinAAA') {
      distortedCards = this.distortRandomHandCard(hand, distortedCards);
    }
    this.update({
      ...state,
      hand: this.sortByFace(hand, distortedCards),
      drawPile: replenished.drawPile,
      discardPile: replenished.discardPile,
      selectedIds: [],
      distortedCards,
      discardsLeft: state.discardsLeft - 1,
      announcement: `${discardedCards.length} ${discardedCards.length === 1 ? 'carta scartata' : 'carte scartate'}. Ti restano ${state.discardsLeft - 1} scarti.`,
    });
  }

  sortHand(): void {
    const state = this.currentState();
    if (state.phase !== 'playing') return;

    this.update({
      ...state,
      hand: this.sortByFace(state.hand, state.distortedCards),
      announcement: 'Mano ordinata da sinistra a destra: dal valore più alto al più basso.',
    });
  }

  buyJoker(jokerId: JokerId): void {
    const state = this.currentState();
    const joker = JOKERS.find((item) => item.id === jokerId);
    if (state.phase !== 'shop' || !joker || !state.shopOffers.includes(jokerId)) return;
    if (state.money < joker.price) {
      this.announce(`Servono ${joker.price} dollari per acquistare ${joker.name}.`);
      return;
    }
    if (state.jokerIds.length >= MAX_JOKERS) {
      this.announce('Hai già il numero massimo di cinque jolly.');
      return;
    }

    this.update({
      ...state,
      money: state.money - joker.price,
      jokerIds: [...state.jokerIds, jokerId],
      shopOffers: state.shopOffers.filter((offer) => offer !== jokerId),
      announcement: `${joker.name} aggiunto ai tuoi jolly.`,
    });
  }

  continueToNextRound(): void {
    const state = this.currentState();
    if (state.phase !== 'shop' || state.round >= 8) return;

    const round = state.round + 1;
    this.update({
      ...state,
      phase: 'overview',
      round,
      blind: 0,
      target: BLIND_TARGETS[round][0],
      roundScore: 0,
      handsLeft: HANDS_PER_ROUND,
      discardsLeft: DISCARDS_PER_ROUND,
      hand: [],
      drawPile: shuffle(createDeck()),
      discardPile: [],
      selectedIds: [],
      shopOffers: [],
      announcement: `Ante ${round}. Piccolo buio: obiettivo ${BLIND_TARGETS[round][0]} punti. Consulta i prossimi bui e premi Gioca per iniziare.`,
    });
  }

  private createShopOffers(ownedJokers: readonly JokerId[]): JokerId[] {
    const available = JOKERS.map((joker) => joker.id).filter((id) => !ownedJokers.includes(id));
    return shuffle(available).slice(0, 3);
  }

  private announce(message: string): void {
    this.update({ ...this.currentState(), announcement: message });
  }

  private update(state: GameState): void {
    this.currentState.set(state);
    this.save(state);
  }

  private restore(): void {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return;

      const parsed: unknown = JSON.parse(saved);
      if (
        isRecord(parsed) &&
        (parsed['version'] === 1 || parsed['version'] === 2) &&
        isGameState(parsed['state'])
      ) {
        const restoredState = {
          ...parsed['state'],
          blind:
            parsed['state'].blind ??
            (parsed['version'] === 1 && parsed['state'].phase === 'shop' ? 2 : 0),
          distortedCards: parsed['state'].distortedCards ?? {},
          hand: this.sortByFace(parsed['state'].hand, parsed['state'].distortedCards ?? {}),
        };
        this.currentState.set(restoredState);
        this.save(restoredState);
        return;
      }

      this.storageNotice.set(
        'Il salvataggio trovato non è valido. Avvia una nuova partita per sostituirlo.',
      );
      console.error('Il salvataggio locale di Seme e Fiori non supera la verifica dei dati.');
    } catch (error) {
      this.storageNotice.set('Non è stato possibile leggere il salvataggio locale.');
      console.error('Errore durante il ripristino della partita salvata:', error);
    }
  }

  private save(state: GameState): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, state }));
      this.storageNotice.set('');
    } catch (error) {
      this.storageNotice.set(
        'Salvataggio non disponibile: la partita resta attiva finché non chiudi questa pagina.',
      );
      console.error('Errore durante il salvataggio della partita:', error);
    }
  }

  effectiveCard(card: Card, distortedCards = this.currentState().distortedCards): Card {
    const face = distortedCards[card.id];
    return face ? { ...card, ...face } : card;
  }

  private currentBoss(state: GameState): BossDefinition | undefined {
    return state.phase === 'playing' && state.blind === 2
      ? BOSS_DEFINITIONS[state.round]
      : undefined;
  }

  private handSizeFor(round: number, blind: number): number {
    return blind === 2 && BOSS_DEFINITIONS[round]?.id === 'pannoso'
      ? INITIAL_HAND_SIZE - 2
      : INITIAL_HAND_SIZE;
  }

  private sortByFace(cards: readonly Card[], distortedCards: Record<string, CardFace>): Card[] {
    return [...cards].sort((a, b) =>
      compareCardsByRank(
        this.effectiveCard(b, distortedCards),
        this.effectiveCard(a, distortedCards),
      ),
    );
  }

  private distortRandomHandCard(
    hand: readonly Card[],
    distortedCards: Record<string, CardFace>,
  ): Record<string, CardFace> {
    if (hand.length === 0) return distortedCards;
    const card = hand[Math.floor(Math.random() * hand.length)];
    const face = this.effectiveCard(card, distortedCards);
    const changeRank = Math.random() < 0.5;
    return {
      ...distortedCards,
      [card.id]: changeRank
        ? { ...face, rank: (Math.floor(Math.random() * 13) + 2) as Rank }
        : { ...face, suit: SUITS[Math.floor(Math.random() * SUITS.length)] },
    };
  }

  private keepFacesForHand(
    distortedCards: Record<string, CardFace>,
    hand: readonly Card[],
  ): Record<string, CardFace> {
    const handIds = new Set(hand.map((card) => card.id));
    return Object.fromEntries(Object.entries(distortedCards).filter(([id]) => handIds.has(id)));
  }

  private evaluateKind(cards: readonly Card[]) {
    return evaluateHand(cards).kind;
  }
}
