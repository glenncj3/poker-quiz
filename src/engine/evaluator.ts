import type { Card, EvaluatedHand, Rank } from '../types/card';
import { HandType, RANK_VALUES, HAND_TYPE_NAMES } from '../types/card';

/**
 * Generate all combinations of size k from an array.
 */
export function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const results: T[][] = [];

  function recurse(start: number, current: T[]) {
    if (current.length === k) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      recurse(i + 1, current);
      current.pop();
    }
  }

  recurse(0, []);
  return results;
}

function rankVal(rank: Rank): number {
  return RANK_VALUES[rank];
}

function formatRank(rank: Rank): string {
  const names: Record<string, string> = {
    'A': 'Ace', 'K': 'King', 'Q': 'Queen', 'J': 'Jack',
    '10': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven',
    '6': 'Six', '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two',
  };
  return names[rank] || rank;
}

function pluralRank(rank: Rank): string {
  const names: Record<string, string> = {
    'A': 'Aces', 'K': 'Kings', 'Q': 'Queens', 'J': 'Jacks',
    '10': 'Tens', '9': 'Nines', '8': 'Eights', '7': 'Sevens',
    '6': 'Sixes', '5': 'Fives', '4': 'Fours', '3': 'Threes', '2': 'Twos',
  };
  return names[rank] || rank + 's';
}

/**
 * Evaluate a 5-card poker hand.
 * Returns a composite score where higher is better:
 * score = (tier * 10^10) + (primary * 10^8) + (secondary * 10^6) + kickers
 */
export function evaluate5(cards: Card[]): EvaluatedHand {
  if (cards.length !== 5) throw new Error('evaluate5 requires exactly 5 cards');

  const sorted = [...cards].sort((a, b) => rankVal(b.rank) - rankVal(a.rank));
  const values = sorted.map(c => rankVal(c.rank));

  // Flush check
  const isFlush = sorted.every(c => c.suit === sorted[0].suit);

  // Straight check
  let isStraight = false;
  let straightHigh = 0;

  // Normal straight
  if (values[0] - values[4] === 4 && new Set(values).size === 5) {
    isStraight = true;
    straightHigh = values[0];
  }

  // Ace-low straight (A-2-3-4-5 wheel)
  if (!isStraight && values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    isStraight = true;
    straightHigh = 5; // 5-high straight
  }

  // Royal Flush / Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        type: HandType.RoyalFlush,
        score: 9 * 1e10 + 14 * 1e8,
        cards: sorted,
        name: 'Royal Flush',
      };
    }
    return {
      type: HandType.StraightFlush,
      score: 8 * 1e10 + straightHigh * 1e8,
      cards: sorted,
      name: `Straight Flush, ${formatRank(numToRank(straightHigh))} high`,
    };
  }

  // Rank frequency analysis
  const freq: Record<number, number> = {};
  for (const v of values) {
    freq[v] = (freq[v] || 0) + 1;
  }
  const entries = Object.entries(freq)
    .map(([v, count]) => ({ value: Number(v), count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  // Four of a Kind
  if (entries[0].count === 4) {
    const quadVal = entries[0].value;
    const kicker = entries[1].value;
    return {
      type: HandType.FourOfAKind,
      score: 7 * 1e10 + quadVal * 1e8 + kicker * 1e6,
      cards: sorted,
      name: `Four of a Kind, ${pluralRank(numToRank(quadVal))}`,
    };
  }

  // Full House
  if (entries[0].count === 3 && entries[1].count === 2) {
    const tripVal = entries[0].value;
    const pairVal = entries[1].value;
    return {
      type: HandType.FullHouse,
      score: 6 * 1e10 + tripVal * 1e8 + pairVal * 1e6,
      cards: sorted,
      name: `Full House, ${pluralRank(numToRank(tripVal))} full of ${pluralRank(numToRank(pairVal))}`,
    };
  }

  // Flush
  if (isFlush) {
    const score = 5 * 1e10 + values[0] * 1e8 + values[1] * 1e6 + values[2] * 1e4 + values[3] * 1e2 + values[4];
    return {
      type: HandType.Flush,
      score,
      cards: sorted,
      name: `Flush, ${formatRank(sorted[0].rank)} high`,
    };
  }

  // Straight
  if (isStraight) {
    return {
      type: HandType.Straight,
      score: 4 * 1e10 + straightHigh * 1e8,
      cards: sorted,
      name: `Straight, ${formatRank(numToRank(straightHigh))} high`,
    };
  }

  // Three of a Kind
  if (entries[0].count === 3) {
    const tripVal = entries[0].value;
    const kickers = entries.filter(e => e.count === 1).map(e => e.value).sort((a, b) => b - a);
    return {
      type: HandType.ThreeOfAKind,
      score: 3 * 1e10 + tripVal * 1e8 + kickers[0] * 1e6 + kickers[1] * 1e4,
      cards: sorted,
      name: `Three of a Kind, ${pluralRank(numToRank(tripVal))}`,
    };
  }

  // Two Pair
  if (entries[0].count === 2 && entries[1].count === 2) {
    const highPair = Math.max(entries[0].value, entries[1].value);
    const lowPair = Math.min(entries[0].value, entries[1].value);
    const kicker = entries[2].value;
    return {
      type: HandType.TwoPair,
      score: 2 * 1e10 + highPair * 1e8 + lowPair * 1e6 + kicker * 1e4,
      cards: sorted,
      name: `Two Pair, ${pluralRank(numToRank(highPair))} and ${pluralRank(numToRank(lowPair))}`,
    };
  }

  // Pair
  if (entries[0].count === 2) {
    const pairVal = entries[0].value;
    const kickers = entries.filter(e => e.count === 1).map(e => e.value).sort((a, b) => b - a);
    return {
      type: HandType.Pair,
      score: 1 * 1e10 + pairVal * 1e8 + kickers[0] * 1e6 + kickers[1] * 1e4 + kickers[2] * 1e2,
      cards: sorted,
      name: `Pair of ${pluralRank(numToRank(pairVal))}`,
    };
  }

  // High Card
  const score = 0 * 1e10 + values[0] * 1e8 + values[1] * 1e6 + values[2] * 1e4 + values[3] * 1e2 + values[4];
  return {
    type: HandType.HighCard,
    score,
    cards: sorted,
    name: `${formatRank(sorted[0].rank)} High`,
  };
}

function numToRank(value: number): Rank {
  const map: Record<number, Rank> = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
    10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
  };
  return map[value] || 'A';
}

/**
 * Given 7 cards (2 hole + 5 community), find the best 5-card hand.
 */
export function evaluateHand(holeCards: Card[], communityCards: Card[]): EvaluatedHand {
  const allCards = [...holeCards, ...communityCards];
  const combos = combinations(allCards, 5);
  let bestHand: EvaluatedHand | null = null;

  for (const combo of combos) {
    const hand = evaluate5(combo);
    if (!bestHand || hand.score > bestHand.score) {
      bestHand = hand;
    }
  }

  return bestHand!;
}
