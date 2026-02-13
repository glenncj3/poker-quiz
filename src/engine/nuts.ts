import type { Card } from '../types/card';
import { createOrderedDeck, removeCards } from './deck';
import { evaluateHand, combinations } from './evaluator';

/**
 * Find the best possible hole cards (the "nuts") given 5 community cards.
 * Iterates all C(47,2) = 1081 possible hole card combos.
 */
export function findNuts(communityCards: Card[]): { holeCards: Card[]; hand: ReturnType<typeof evaluateHand> } {
  const remaining = removeCards(createOrderedDeck(), communityCards);

  const allHoleCombos = combinations(remaining, 2);
  let bestHole: Card[] = allHoleCombos[0];
  let bestHand = evaluateHand(bestHole, communityCards);

  for (let i = 1; i < allHoleCombos.length; i++) {
    const hole = allHoleCombos[i];
    const hand = evaluateHand(hole, communityCards);
    if (hand.score > bestHand.score) {
      bestHand = hand;
      bestHole = hole;
    }
  }

  return { holeCards: bestHole, hand: bestHand };
}

/**
 * Find the top N distinct hands given community cards.
 * Returns hands sorted by score descending.
 */
export function findTopNHands(
  communityCards: Card[],
  n: number
): { holeCards: Card[]; hand: ReturnType<typeof evaluateHand> }[] {
  const remaining = removeCards(createOrderedDeck(), communityCards);

  const allHoleCombos = combinations(remaining, 2);
  const results = allHoleCombos.map(hole => ({
    holeCards: hole,
    hand: evaluateHand(hole, communityCards),
  }));

  results.sort((a, b) => b.hand.score - a.hand.score);

  // Deduplicate by score to get distinct hand strengths
  const seen = new Set<number>();
  const unique: typeof results = [];
  for (const r of results) {
    if (!seen.has(r.hand.score)) {
      seen.add(r.hand.score);
      unique.push(r);
    }
    if (unique.length >= n) break;
  }

  return unique;
}
