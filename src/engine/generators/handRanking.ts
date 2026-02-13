import type { Question, Option, Scenario } from '../../types/quiz';
import { createDeck, drawCards, cardKey } from '../deck';
import { evaluateHand } from '../evaluator';
import { formatHoleCards } from '../format';

/**
 * Generate a hand ranking question: "Which player has the best hand?"
 * Deals community cards + 4 players' hole cards, asks who wins.
 */
export function generateHandRankingQuestion(): Question {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: community, remaining: r1 } = drawCards(deck, 5);
    const { drawn: p1, remaining: r2 } = drawCards(r1, 2);
    const { drawn: p2, remaining: r3 } = drawCards(r2, 2);
    const { drawn: p3, remaining: r4 } = drawCards(r3, 2);
    const { drawn: p4 } = drawCards(r4, 2);

    const players = [p1, p2, p3, p4];
    const hands = players.map(hole => evaluateHand(hole, community));

    // Ensure at least 2 different hand types for an interesting question
    const types = new Set(hands.map(h => h.type));
    if (types.size < 2) continue;

    // Ensure all 4 players have distinct hand strengths (no ties)
    const scores = new Set(hands.map(h => h.score));
    if (scores.size < 4) continue;

    // Find the winner
    let bestIdx = 0;
    for (let i = 1; i < hands.length; i++) {
      if (hands[i].score > hands[bestIdx].score) {
        bestIdx = i;
      }
    }

    // Verify no duplicate cards
    const allCards = [...community, ...players.flat()];
    const cardSet = new Set(allCards.map(cardKey));
    if (cardSet.size !== allCards.length) continue;

    const playerLabels = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

    const options: Option[] = players.map((hole, i) => ({
      id: `opt_${i}`,
      label: `${playerLabels[i]}: ${formatHoleCards(hole)}`,
      cards: hole,
      isCorrect: i === bestIdx,
    }));

    const scenario: Scenario = {
      communityCards: community,
      opponentHands: players,
    };

    const handDescriptions = players.map((_, i) =>
      `${playerLabels[i]} has ${hands[i].name}`
    ).join('. ');

    return {
      id: crypto.randomUUID(),
      category: 'handRanking',
      questionText: 'Which player has the strongest hand?',
      scenario,
      options,
      explanation: `${handDescriptions}. ${playerLabels[bestIdx]} wins with ${hands[bestIdx].name}.`,
    };
  }

  throw new Error('Failed to generate hand ranking question after max attempts');
}
