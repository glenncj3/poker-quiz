import type { Card } from '../../types/card';
import type { Question, Option, Scenario } from '../../types/quiz';
import type { EvaluatedHand } from '../../types/card';
import { createDeck, drawCards } from '../deck';
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
 * Generate a nuts reading question.
 * targetRank: 1 = best hand (nuts), 2 = second-best, 3 = third-best.
 * Shows community cards on flop, turn, or river; correct answer is the target-ranked hole cards.
 */
export function generateNutsReadingQuestion(options?: { targetRank?: number }): Question {
  const maxAttempts = 50;
  const targetRank = options?.targetRank ?? 1;
  const street = pickStreet();
  const ccCount = communityCardCount(street);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: community } = drawCards(deck, ccCount);

    // Skip boards with paired ranks — they make four-of-a-kind the nuts too often
    const ranks = community.map(c => c.rank);
    if (new Set(ranks).size !== ranks.length) continue;

    const topHands = findTopNHands(community, 16);
    if (topHands.length < targetRank + 3) continue;

    const correctHand = topHands[targetRank - 1];

    // Always use the top 4 distinct-strength hands as options
    const distractors: HandResult[] = [];
    for (let i = 0; i < topHands.length && distractors.length < 3; i++) {
      if (i === targetRank - 1) continue;
      distractors.push(topHands[i]);
    }

    if (distractors.length < 3) continue;

    const rankLabel = targetRank === 1 ? 'best' : targetRank === 2 ? 'second-best' : 'third-best';
    const streetPhrase = `on the ${street.toLowerCase()}`;

    const opts: Option[] = [
      {
        id: 'opt_correct',
        label: formatHoleCards(correctHand.holeCards),
        cards: correctHand.holeCards,
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
      questionText: `Which two cards make the ${rankLabel} possible hand ${streetPhrase}?`,
      scenario: { communityCards: community, street } as Scenario,
      options: shuffle(opts),
      explanation: targetRank === 1
        ? `The best possible hand ${streetPhrase} is ${formatHoleCards(correctHand.holeCards)}, making ${correctHand.hand.name}.`
        : `The ${rankLabel} hand ${streetPhrase} is ${formatHoleCards(correctHand.holeCards)}, making ${correctHand.hand.name}.`,
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
