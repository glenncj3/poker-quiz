import type { Card } from '../../types/card';
import type { Question, Option, Scenario } from '../../types/quiz';
import type { EvaluatedHand } from '../../types/card';
import { createDeck, drawCards, cardKey } from '../deck';
import { findTopNHands } from '../nuts';
import { shuffle } from '../../utils/shuffle';

interface HandResult {
  holeCards: Card[];
  hand: EvaluatedHand;
}

/**
 * Generate a nuts reading question: "What is the best possible hand (the nuts)?"
 * Shows 5 community cards, correct answer is the nuts hole cards.
 */
export function generateNutsReadingQuestion(): Question {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: community } = drawCards(deck, 5);

    // Find top 6 distinct hands
    const topHands = findTopNHands(community, 6);
    if (topHands.length < 4) continue;

    const nuts = topHands[0];

    // Find 3 distractors that don't share cards with community or nuts
    const distractors: HandResult[] = [];
    const usedKeys = new Set([...community, ...nuts.holeCards].map(cardKey));

    for (let i = 1; i < topHands.length && distractors.length < 3; i++) {
      const d = topHands[i];
      const dKeys = d.holeCards.map(cardKey);
      const conflict = dKeys.some(k =>
        usedKeys.has(k) ||
        distractors.some(ad => ad.holeCards.some(c => cardKey(c) === k))
      );
      if (!conflict) {
        distractors.push(d);
        dKeys.forEach(k => usedKeys.add(k));
      }
    }

    if (distractors.length < 3) continue;

    const options: Option[] = [
      {
        id: 'opt_nuts',
        label: formatHoleCards(nuts.holeCards),
        cards: nuts.holeCards,
        isCorrect: true,
      },
      ...distractors.map((d, i) => ({
        id: `opt_d${i}`,
        label: formatHoleCards(d.holeCards),
        cards: d.holeCards,
        isCorrect: false,
      })),
    ];

    return {
      id: crypto.randomUUID(),
      category: 'nutsReading',
      questionText: 'Which hole cards make the best possible hand (the nuts)?',
      scenario: { communityCards: community } as Scenario,
      options: shuffle(options),
      explanation: `The nuts is ${formatHoleCards(nuts.holeCards)}, making ${nuts.hand.name}.`,
    };
  }

  throw new Error('Failed to generate nuts reading question after max attempts');
}

function formatHoleCards(cards: Card[]): string {
  return cards.map(c => `${c.rank}${suitSymbol(c.suit)}`).join(' ');
}

function suitSymbol(suit: string): string {
  const symbols: Record<string, string> = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
  };
  return symbols[suit] || suit;
}
