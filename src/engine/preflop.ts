import type { Card, Rank } from '../types/card';
import { RANK_VALUES } from '../types/card';

export const PreflopTier = {
  Trash: 1,
  Steal: 2,
  LPOpen: 3,
  MPOpen: 4,
  UTGOpen: 5,
  Strong: 6,
  Premium: 7,
} as const;

export type PreflopTier = (typeof PreflopTier)[keyof typeof PreflopTier];

const RANK_CHAR: Record<Rank, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
  '8': '8', '9': '9', '10': 'T', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
};

/** Convert two hole cards to canonical shorthand, e.g. "AKs", "QJo", "TT". */
export function handNotation(holeCards: Card[]): string {
  const [a, b] = holeCards;
  const va = RANK_VALUES[a.rank];
  const vb = RANK_VALUES[b.rank];
  const high = va >= vb ? a : b;
  const low = va >= vb ? b : a;
  const h = RANK_CHAR[high.rank];
  const l = RANK_CHAR[low.rank];
  if (h === l) return `${h}${l}`;
  const suffix = high.suit === low.suit ? 's' : 'o';
  return `${h}${l}${suffix}`;
}

const PREMIUM = new Set(['AA', 'KK', 'QQ', 'AKs']);

const STRONG = new Set(['JJ', 'TT', 'AQs', 'AJs', 'AKo', 'KQs']);

const UTG_OPEN = new Set([
  '99', '88',
  'ATs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs',
  'AQo', 'AJo',
]);

const MP_OPEN = new Set([
  '77', '66',
  'A9s', 'A8s', 'A7s', 'A6s', 'A5s',
  'K9s', 'Q9s', 'J9s', 'T9s', '98s', '87s',
  'ATo', 'KQo', 'KJo',
]);

const LP_OPEN = new Set([
  '55', '44',
  'A4s', 'A3s', 'A2s',
  'K8s', 'K7s', 'K6s', 'Q8s', 'J8s', 'T8s',
  '76s', '65s', '54s',
  'KTo', 'QJo', 'JTo',
]);

const STEAL = new Set([
  '33', '22',
  'K5s', 'K4s', 'K3s', 'K2s',
  'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  'J7s', 'T7s', '97s', '86s', '75s', '64s', '53s', '43s',
  'QTo', 'T9o',
  'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
]);

/** Classify a preflop hand into a tier (7=best, 1=worst). */
export function classifyPreflopHand(holeCards: Card[]): PreflopTier {
  const notation = handNotation(holeCards);
  if (PREMIUM.has(notation)) return PreflopTier.Premium;
  if (STRONG.has(notation)) return PreflopTier.Strong;
  if (UTG_OPEN.has(notation)) return PreflopTier.UTGOpen;
  if (MP_OPEN.has(notation)) return PreflopTier.MPOpen;
  if (LP_OPEN.has(notation)) return PreflopTier.LPOpen;
  if (STEAL.has(notation)) return PreflopTier.Steal;
  return PreflopTier.Trash;
}
