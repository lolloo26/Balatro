import { Card, createDeck, evaluateHand, JokerId, shuffle, sortCardsByRank } from './game';

function cards(specs: [Card['rank'], Card['suit']][]): Card[] {
  return specs.map(([rank, suit]) => ({ id: `${suit}-${rank}`, rank, suit }));
}

describe('poker hand evaluation', () => {
  it('creates and shuffles a complete 52-card deck without duplicates', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
    expect(shuffle(deck, () => 0)).toHaveLength(52);
  });

  it('scores a pair of kings as (10 + 10 + 10) × 2 = 60', () => {
    const result = evaluateHand(
      cards([
        [13, 'hearts'],
        [13, 'spades'],
      ]),
    );

    expect(result.name).toBe('Coppia');
    expect(result.scoringCards).toHaveLength(2);
    expect(result.chips).toBe(30);
    expect(result.multiplier).toBe(2);
    expect(result.score).toBe(60);
  });

  it('uses only the cards in a pair and ignores an unrelated kicker', () => {
    const result = evaluateHand(
      cards([
        [8, 'hearts'],
        [8, 'spades'],
        [14, 'diamonds'],
        [4, 'clubs'],
        [2, 'hearts'],
      ]),
    );

    expect(result.kind).toBe('pair');
    expect(result.scoringCards.map((card) => card.rank)).toEqual([8, 8]);
    expect(result.score).toBe((10 + 8 + 8) * 2);
  });

  it('recognizes a two pair and scores only its four matching cards', () => {
    const result = evaluateHand(
      cards([
        [10, 'hearts'],
        [10, 'diamonds'],
        [8, 'clubs'],
        [8, 'spades'],
        [2, 'hearts'],
      ]),
    );

    expect(result.kind).toBe('two-pair');
    expect(result.scoringCards).toHaveLength(4);
    expect(result.score).toBe((20 + 10 + 10 + 8 + 8) * 2);
  });

  it('recognizes trips, a full house, and four of a kind', () => {
    const threeOfAKind = evaluateHand(
      cards([
        [8, 'hearts'],
        [8, 'diamonds'],
        [8, 'clubs'],
      ]),
    );
    const fullHouse = evaluateHand(
      cards([
        [8, 'hearts'],
        [8, 'diamonds'],
        [8, 'clubs'],
        [4, 'spades'],
        [4, 'hearts'],
      ]),
    );
    const fourOfAKind = evaluateHand(
      cards([
        [10, 'hearts'],
        [10, 'diamonds'],
        [10, 'clubs'],
        [10, 'spades'],
        [2, 'hearts'],
      ]),
    );

    expect(threeOfAKind.kind).toBe('three-kind');
    expect(threeOfAKind.score).toBe((30 + 8 + 8 + 8) * 3);
    expect(fullHouse.kind).toBe('full-house');
    expect(fullHouse.score).toBe((40 + 8 + 8 + 8 + 4 + 4) * 4);
    expect(fourOfAKind.kind).toBe('four-kind');
    expect(fourOfAKind.score).toBe((60 + 10 + 10 + 10 + 10) * 7);
  });

  it('recognizes a five-card flush', () => {
    const result = evaluateHand(
      cards([
        [2, 'hearts'],
        [4, 'hearts'],
        [6, 'hearts'],
        [8, 'hearts'],
        [10, 'hearts'],
      ]),
    );

    expect(result.kind).toBe('flush');
    expect(result.score).toBe((35 + 2 + 4 + 6 + 8 + 10) * 4);
  });

  it('recognizes an ace-low straight', () => {
    const result = evaluateHand(
      cards([
        [14, 'hearts'],
        [2, 'spades'],
        [3, 'diamonds'],
        [4, 'clubs'],
        [5, 'hearts'],
      ]),
    );

    expect(result.kind).toBe('straight');
    expect(result.scoringCards).toHaveLength(5);
    expect(result.score).toBe((30 + 11 + 2 + 3 + 4 + 5) * 4);
  });

  it('recognizes a straight flush above four of a kind', () => {
    const result = evaluateHand(
      cards([
        [9, 'diamonds'],
        [10, 'diamonds'],
        [11, 'diamonds'],
        [12, 'diamonds'],
        [13, 'diamonds'],
      ]),
    );

    expect(result.kind).toBe('straight-flush');
    expect(result.score).toBe((100 + 9 + 10 + 10 + 10 + 10) * 8);
  });

  it('applies each joker only when its condition is met', () => {
    const pair = cards([
      [13, 'hearts'],
      [13, 'spades'],
    ]);
    const activeJokers: JokerId[] = ['lucky-coin', 'royal-spark', 'club-crown', 'star-compass'];
    const result = evaluateHand(pair, activeJokers);

    expect(result.jokerChips).toBe(40);
    expect(result.multiplier).toBe(6);
    expect(result.score).toBe((10 + 20 + 40) * 6);
    expect(result.jokerNotes).toHaveLength(3);
  });

  it('adds the ace joker bonus only when an ace scores', () => {
    const ace = evaluateHand(cards([[14, 'hearts']]), ['ace-empress']);
    const king = evaluateHand(cards([[13, 'spades']]), ['ace-empress']);

    expect(ace.jokerChips).toBe(20);
    expect(ace.score).toBe(36);
    expect(king.jokerChips).toBe(0);
  });

  it('removes debuffed card chips and disables selected jokers for one evaluation', () => {
    const pair = cards([
      [13, 'hearts'],
      [13, 'spades'],
    ]);
    const baseline = evaluateHand(pair, ['lucky-coin', 'royal-spark']);
    const bossResult = evaluateHand(pair, ['lucky-coin', 'royal-spark'], {
      disabledCardIds: pair.map((card) => card.id),
      disabledJokerIds: ['lucky-coin', 'royal-spark'],
      scoreMultiplier: 0.5,
    });

    expect(baseline.score).toBe(270);
    expect(bossResult.scoringCards).toHaveLength(0);
    expect(bossResult.chips).toBe(10);
    expect(bossResult.multiplier).toBe(2);
    expect(bossResult.score).toBe(10);
  });

  it('sorts higher ranks first so they render from left to right in the hand', () => {
    const hand = cards([
      [2, 'hearts'],
      [14, 'spades'],
      [8, 'clubs'],
      [11, 'diamonds'],
    ]);

    expect(sortCardsByRank(hand).map((card) => card.rank)).toEqual([14, 11, 8, 2]);
  });

  it('rejects an empty hand or more than five cards', () => {
    expect(() => evaluateHand([])).toThrow();
    expect(() =>
      evaluateHand(
        cards([
          [2, 'hearts'],
          [3, 'hearts'],
          [4, 'hearts'],
          [5, 'hearts'],
          [6, 'hearts'],
          [7, 'hearts'],
        ]),
      ),
    ).toThrow();
  });
});
