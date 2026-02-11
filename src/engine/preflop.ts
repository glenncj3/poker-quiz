import type { Card, Rank } from '../types/card';
import { RANK_VALUES } from '../types/card';

export const PreflopTier = {
  Weak: 1,
  Marginal: 2,
  Playable: 3,
  Strong: 4,
  Premium: 5,
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
const PLAYABLE = new Set([
  '99', '88', '77',
  'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KJs', 'KTs', 'QJs',
  'AQo', 'AJo', 'KQo',
]);
const MARGINAL = new Set([
  '66', '55', '44', '33', '22',
  'T9s', '98s', '87s', '76s', '65s', '54s',
  'QTs', 'J9s', 'T8s',
  'ATo', 'KJo', 'QJo', 'JTo',
]);

/** Classify a preflop hand into a tier (5=best, 1=worst). */
export function classifyPreflopHand(holeCards: Card[]): PreflopTier {
  const notation = handNotation(holeCards);
  if (PREMIUM.has(notation)) return PreflopTier.Premium;
  if (STRONG.has(notation)) return PreflopTier.Strong;
  if (PLAYABLE.has(notation)) return PreflopTier.Playable;
  if (MARGINAL.has(notation)) return PreflopTier.Marginal;
  return PreflopTier.Weak;
}
