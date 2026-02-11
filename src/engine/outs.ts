import type { Card, HandType } from '../types/card';
import { SUITS, RANKS } from '../types/card';
import { cardKey } from './deck';
import { evaluateHand } from './evaluator';

export interface OutCard {
  card: Card;
  improvementDelta: number;
  newHandName: string;
  newHandType: HandType;
}

/**
 * Find all outs — cards that improve the hand — given hole cards and community cards.
 * Evaluates each remaining card as a potential addition to the community.
 */
export function findOuts(holeCards: Card[], communityCards: Card[]): OutCard[] {
  const usedKeys = new Set([...holeCards, ...communityCards].map(cardKey));
  const currentHand = evaluateHand(holeCards, communityCards);

  const outs: OutCard[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const card: Card = { suit, rank };
      if (usedKeys.has(cardKey(card))) continue;

      const newCommunity = [...communityCards, card];
      const newHand = evaluateHand(holeCards, newCommunity);

      if (newHand.type > currentHand.type) {
        outs.push({
          card,
          improvementDelta: newHand.score - currentHand.score,
          newHandName: newHand.name,
          newHandType: newHand.type,
        });
      }
    }
  }

  // Sort by improvement delta descending
  outs.sort((a, b) => b.improvementDelta - a.improvementDelta);
  return outs;
}
