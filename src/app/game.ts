export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type JokerId = 'lucky-coin' | 'royal-spark' | 'club-crown' | 'star-compass' | 'ace-empress';

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export interface Joker {
  id: JokerId;
  name: string;
  description: string;
  price: number;
}

export type HandKind =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-kind'
  | 'straight-flush';

export interface HandScore {
  kind: HandKind;
  name: string;
  scoringCards: Card[];
  baseChips: number;
  cardChips: number;
  jokerChips: number;
  chips: number;
  multiplier: number;
  score: number;
  jokerNotes: string[];
}

export interface HandModifiers {
  disabledCardIds?: readonly string[];
  disabledJokerIds?: readonly JokerId[];
  scoreMultiplier?: number;
}

export const SUIT_NAMES: Record<Suit, string> = {
  hearts: 'cuori',
  diamonds: 'quadri',
  clubs: 'fiori',
  spades: 'picche',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const RANK_NAMES: Record<Rank, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'Jack',
  12: 'Regina',
  13: 'Re',
  14: 'Asso',
};

export const HAND_RULES: Record<HandKind, { name: string; chips: number; multiplier: number }> = {
  'high-card': { name: 'Carta alta', chips: 5, multiplier: 1 },
  pair: { name: 'Coppia', chips: 10, multiplier: 2 },
  'two-pair': { name: 'Doppia coppia', chips: 20, multiplier: 2 },
  'three-kind': { name: 'Tris', chips: 30, multiplier: 3 },
  straight: { name: 'Scala', chips: 30, multiplier: 4 },
  flush: { name: 'Colore', chips: 35, multiplier: 4 },
  'full-house': { name: 'Full', chips: 40, multiplier: 4 },
  'four-kind': { name: 'Poker', chips: 60, multiplier: 7 },
  'straight-flush': { name: 'Scala colore', chips: 100, multiplier: 8 },
};

export const JOKERS: readonly Joker[] = [
  {
    id: 'lucky-coin',
    name: 'Moneta fortunata',
    description: '+15 fiches a ogni mano.',
    price: 4,
  },
  {
    id: 'royal-spark',
    name: 'Fiore regale',
    description:
      '+4 al moltiplicatore se tra le carte che segnano punti c’è un Jack, una Regina o un Re.',
    price: 5,
  },
  {
    id: 'club-crown',
    name: 'Corona del mazzo',
    description: '+25 fiches con coppia, doppia coppia, tris, full o poker.',
    price: 5,
  },
  {
    id: 'star-compass',
    name: 'Giglio fortunato',
    description: 'Raddoppia il moltiplicatore con scala, colore o scala colore.',
    price: 6,
  },
  {
    id: 'ace-empress',
    name: 'Corona dell’asso',
    description: '+20 fiches se un Asso fa parte della combinazione.',
    price: 5,
  },
];

const SUIT_INDEX: Record<Suit, number> = {
  hearts: 0,
  diamonds: 1,
  clubs: 2,
  spades: 3,
};

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => {
      const rank = (index + 2) as Rank;
      return { id: `${suit}-${rank}`, rank, suit };
    }),
  );
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function cardValue(rank: Rank): number {
  if (rank === 14) return 11;
  return Math.min(rank, 10);
}

export function evaluateHand(
  cards: readonly Card[],
  jokerIds: readonly JokerId[] = [],
  modifiers: HandModifiers = {},
): HandScore {
  if (cards.length < 1 || cards.length > 5) {
    throw new Error('Per valutare una mano servono da una a cinque carte.');
  }

  const rankCounts = new Map<Rank, number>();
  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);
  }

  const groups = [...rankCounts.entries()].sort(
    ([rankA, countA], [rankB, countB]) => countB - countA || rankB - rankA,
  );
  const isFlush = cards.length === 5 && cards.every((card) => card.suit === cards[0].suit);
  const isStraight = cards.length === 5 && formsStraight(cards);
  let kind: HandKind = 'high-card';

  if (isStraight && isFlush) kind = 'straight-flush';
  else if (groups[0][1] === 4) kind = 'four-kind';
  else if (groups[0][1] === 3 && groups[1]?.[1] === 2) kind = 'full-house';
  else if (isFlush) kind = 'flush';
  else if (isStraight) kind = 'straight';
  else if (groups[0][1] === 3) kind = 'three-kind';
  else if (groups.filter(([, count]) => count === 2).length === 2) kind = 'two-pair';
  else if (groups[0][1] === 2) kind = 'pair';

  const scoringRanks = scoringRanksFor(kind, groups);
  const disabledCardIds = new Set(modifiers.disabledCardIds ?? []);
  const disabledJokerIds = new Set(modifiers.disabledJokerIds ?? []);
  const scoringCards = cards.filter(
    (card) => scoringRanks.has(card.rank) && !disabledCardIds.has(card.id),
  );
  const rule = HAND_RULES[kind];
  const cardChips = scoringCards.reduce((total, card) => total + cardValue(card.rank), 0);
  let jokerChips = 0;
  let additiveMultiplier = 0;
  let multiplierFactor = 1;
  const jokerNotes: string[] = [];

  for (const jokerId of jokerIds.filter((id) => !disabledJokerIds.has(id))) {
    switch (jokerId) {
      case 'lucky-coin':
        jokerChips += 15;
        jokerNotes.push('Moneta fortunata: +15 fiches');
        break;
      case 'royal-spark':
        if (scoringCards.some((card) => card.rank >= 11 && card.rank <= 13)) {
          additiveMultiplier += 4;
          jokerNotes.push('Fiore regale: +4 al moltiplicatore');
        }
        break;
      case 'club-crown':
        if (
          kind === 'pair' ||
          kind === 'two-pair' ||
          kind === 'three-kind' ||
          kind === 'full-house' ||
          kind === 'four-kind'
        ) {
          jokerChips += 25;
          jokerNotes.push('Corona del mazzo: +25 fiches');
        }
        break;
      case 'star-compass':
        if (kind === 'straight' || kind === 'flush' || kind === 'straight-flush') {
          multiplierFactor *= 2;
          jokerNotes.push('Giglio fortunato: moltiplicatore raddoppiato');
        }
        break;
      case 'ace-empress':
        if (scoringCards.some((card) => card.rank === 14)) {
          jokerChips += 20;
          jokerNotes.push('Corona dell’asso: +20 fiches');
        }
        break;
    }
  }

  const chips = rule.chips + cardChips + jokerChips;
  const multiplier = (rule.multiplier + additiveMultiplier) * multiplierFactor;

  return {
    kind,
    name: rule.name,
    scoringCards,
    baseChips: rule.chips,
    cardChips,
    jokerChips,
    chips,
    multiplier,
    score: Math.floor(chips * multiplier * (modifiers.scoreMultiplier ?? 1)),
    jokerNotes,
  };
}

function formsStraight(cards: readonly Card[]): boolean {
  const ranks = [...new Set(cards.map((card) => card.rank))].sort((a, b) => a - b);
  if (ranks.length !== 5) return false;
  if (ranks.every((rank, index) => index === 0 || rank === ranks[index - 1] + 1)) return true;

  return ranks.join(',') === '2,3,4,5,14';
}

function scoringRanksFor(kind: HandKind, groups: [Rank, number][]): Set<Rank> {
  switch (kind) {
    case 'straight':
    case 'flush':
    case 'straight-flush':
      return new Set(groups.map(([rank]) => rank));
    case 'four-kind':
      return new Set(groups.filter(([, count]) => count === 4).map(([rank]) => rank));
    case 'full-house':
      return new Set(groups.map(([rank]) => rank));
    case 'three-kind':
      return new Set(groups.filter(([, count]) => count === 3).map(([rank]) => rank));
    case 'two-pair':
      return new Set(groups.filter(([, count]) => count === 2).map(([rank]) => rank));
    case 'pair':
      return new Set(groups.filter(([, count]) => count === 2).map(([rank]) => rank));
    case 'high-card':
      return new Set([groups[0][0]]);
  }
}

export function compareCardsByRank(a: Card, b: Card): number {
  return a.rank - b.rank || SUIT_INDEX[a.suit] - SUIT_INDEX[b.suit];
}

export function sortCardsByRank(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => compareCardsByRank(b, a));
}

export function compareCardsBySuit(a: Card, b: Card): number {
  return SUIT_INDEX[a.suit] - SUIT_INDEX[b.suit] || a.rank - b.rank;
}
