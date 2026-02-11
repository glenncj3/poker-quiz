export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export enum HandType {
  HighCard = 0,
  Pair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export interface EvaluatedHand {
  type: HandType;
  score: number;
  cards: Card[];
  name: string;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export const HAND_TYPE_NAMES: Record<HandType, string> = {
  [HandType.HighCard]: 'High Card',
  [HandType.Pair]: 'Pair',
  [HandType.TwoPair]: 'Two Pair',
  [HandType.ThreeOfAKind]: 'Three of a Kind',
  [HandType.Straight]: 'Straight',
  [HandType.Flush]: 'Flush',
  [HandType.FullHouse]: 'Full House',
  [HandType.FourOfAKind]: 'Four of a Kind',
  [HandType.StraightFlush]: 'Straight Flush',
  [HandType.RoyalFlush]: 'Royal Flush',
};
