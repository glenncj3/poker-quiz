import type { Card } from '../../types/card';
import type { Question, Option, Scenario } from '../../types/quiz';
import type { EvaluatedHand } from '../../types/card';
import { createDeck, drawCards, cardKey } from '../deck';
import { findTopNHands } from '../nuts';
import { shuffle } from '../../utils/shuffle';

type Street = 'Flop' | 'Turn' | 'River';

interface HandResult {
  holeCards: Card[];
  hand: EvaluatedHand;
}

function pickStreet(): Street {
  const roll = Math.random() * 100;
  if (roll < 33) return 'Flop';
  if (roll < 66) return 'Turn';
  return 'River';
}

function communityCardCount(street: Street): number {
  switch (street) {
    case 'Flop': return 3;
    case 'Turn': return 4;
    case 'River': return 5;
  }
}

/**
 * Generate a nuts reading question: "What is the best possible hand (the nuts)?"
 * Shows community cards on flop, turn, or river; correct answer is the nuts hole cards.
 */
export function generateNutsReadingQuestion(options?: { allowOverlap?: boolean }): Question {
  const maxAttempts = 50;
  const allowOverlap = options?.allowOverlap ?? false;
  const street = pickStreet();
  const ccCount = communityCardCount(street);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: community } = drawCards(deck, ccCount);

    // Skip boards with paired ranks — they make four-of-a-kind the nuts too often
    const ranks = community.map(c => c.rank);
    if (new Set(ranks).size !== ranks.length) continue;

    const topHands = findTopNHands(community, 8);
    if (topHands.length < 4) continue;

    const nuts = topHands[0];

    // Find 3 distractors
    const distractors: HandResult[] = [];

    if (allowOverlap) {
      // Take next 3 hands directly — cards may overlap with nuts or each other
      for (let i = 1; i < topHands.length && distractors.length < 3; i++) {
        distractors.push(topHands[i]);
      }
    } else {
      // Strict: distractors can't share cards with community, nuts, or each other
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

    const streetPhrase = `on the ${street.toLowerCase()}`;

    return {
      id: crypto.randomUUID(),
      category: 'nutsReading',
      questionText: `Which hole cards make the best possible hand ${streetPhrase}?`,
      scenario: { communityCards: community, street } as Scenario,
      options: shuffle(options),
      explanation: `The nuts ${streetPhrase} is ${formatHoleCards(nuts.holeCards)}, making ${nuts.hand.name}.`,
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
