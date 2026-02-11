import type { Question, Option, Scenario } from '../../types/quiz';
import { createDeck, drawCards, cardKey } from '../deck';
import { findTopNHands } from '../nuts';
import { shuffle } from '../../utils/shuffle';

/**
 * Generate a nuts reading question: "What is the best possible hand (the nuts)?"
 * Shows 5 community cards, correct answer is the nuts hole cards.
 */
export function generateNutsReadingQuestion(): Question {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: community } = drawCards(deck, 5);

    // Find top 4+ distinct hands
    const topHands = findTopNHands(community, 6);
    if (topHands.length < 4) continue;

    const nuts = topHands[0];

    // Pick 3 distractors from strong-but-not-nuts hands
    const distractors = topHands.slice(1, 4);

    // Verify no duplicate cards across options and community
    const allCards = [...community, ...nuts.holeCards, ...distractors.flatMap(d => d.holeCards)];
    const cardSet = new Set(allCards.map(cardKey));
    if (cardSet.size !== allCards.length) {
      // Try different distractors
      const altDistractors = [];
      for (let i = 1; i < topHands.length && altDistractors.length < 3; i++) {
        const d = topHands[i];
        const dKeys = d.holeCards.map(cardKey);
        const conflict = dKeys.some(k =>
          community.some(c => cardKey(c) === k) ||
          nuts.holeCards.some(c => cardKey(c) === k) ||
          altDistractors.some(ad => ad.holeCards.some(c => cardKey(c) === k))
        );
        if (!conflict) altDistractors.push(d);
      }
      if (altDistractors.length < 3) continue;

      const options: Option[] = [
        {
          id: 'opt_nuts',
          label: formatHoleCards(nuts.holeCards),
          cards: nuts.holeCards,
          isCorrect: true,
        },
        ...altDistractors.map((d, i) => ({
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

function formatHoleCards(cards: import('../../types/card').Card[]): string {
  return cards.map(c => `${c.rank}${suitSymbol(c.suit)}`).join(' ');
}

function suitSymbol(suit: string): string {
  const symbols: Record<string, string> = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
  };
  return symbols[suit] || suit;
}
