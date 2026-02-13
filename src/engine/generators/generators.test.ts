import { describe, it, expect } from 'vitest';
import { generateHandRankingQuestion } from './handRanking';
import { generateNutsReadingQuestion } from './nutsReading';
import { generateOutsImprovementQuestion } from './outsImprovement';
import { generatePreflopActionQuestion } from './preflopAction';
import { cardKey } from '../deck';
import { evaluateHand } from '../evaluator';
import type { Card } from '../../types/card';
import type { Question, Scenario } from '../../types/quiz';

function validateQuestion(q: Question) {
  expect(q.id).toBeTruthy();
  expect(q.questionText).toBeTruthy();
  expect(q.explanation).toBeTruthy();
  expect(q.options.length).toBe(4);

  // Exactly one correct answer
  const correctCount = q.options.filter(o => o.isCorrect).length;
  expect(correctCount).toBe(1);

  // No duplicate option IDs
  const optIds = new Set(q.options.map(o => o.id));
  expect(optIds.size).toBe(q.options.length);
}

function getAllCards(scenario: Scenario): Card[] {
  switch (scenario.type) {
    case 'handRanking':
      return [...scenario.communityCards, ...scenario.opponentHands.flat()];
    case 'nutsReading':
      return [...scenario.communityCards];
    case 'outsImprovement':
      return [...scenario.communityCards, ...scenario.holeCards];
    case 'preflopAction':
      return [...scenario.holeCards];
  }
}

function validateNoDuplicateCards(q: Question) {
  const allCards = getAllCards(q.scenario);
  const keys = allCards.map(cardKey);
  const unique = new Set(keys);
  expect(unique.size).toBe(keys.length);
}

describe('generateHandRankingQuestion', () => {
  it('produces valid questions repeatedly', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateHandRankingQuestion();
      validateQuestion(q);
      validateNoDuplicateCards(q);
      expect(q.category).toBe('handRanking');
      expect(q.scenario.type).toBe('handRanking');
      if (q.scenario.type === 'handRanking') {
        expect(q.scenario.communityCards).toHaveLength(5);
        expect(q.scenario.opponentHands).toHaveLength(4);
      }
    }
  });

  it('all 4 players have distinct hand strengths (no ties)', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateHandRankingQuestion();
      if (q.scenario.type === 'handRanking') {
        const hands = q.scenario.opponentHands;
        const community = q.scenario.communityCards;
        const scores = hands.map(hole => evaluateHand(hole, community).score);
        const uniqueScores = new Set(scores);
        expect(uniqueScores.size).toBe(4);
      }
    }
  });
});

describe('generateNutsReadingQuestion', () => {
  it('produces valid questions across flop, turn, and river', () => {
    const streetsSeen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const q = generateNutsReadingQuestion();
      validateQuestion(q);
      expect(q.category).toBe('nutsReading');
      expect(q.scenario.type).toBe('nutsReading');
      if (q.scenario.type === 'nutsReading') {
        expect(['Flop', 'Turn', 'River']).toContain(q.scenario.street);
        const expectedCC: Record<string, number> = { Flop: 3, Turn: 4, River: 5 };
        expect(q.scenario.communityCards).toHaveLength(expectedCC[q.scenario.street]);
        streetsSeen.add(q.scenario.street);
      }
    }
    expect(streetsSeen.size).toBeGreaterThanOrEqual(2);
  });
});

describe('generateOutsImprovementQuestion', () => {
  it('produces valid questions repeatedly', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateOutsImprovementQuestion();
      validateQuestion(q);
      expect(q.category).toBe('outsImprovement');
      expect(q.scenario.type).toBe('outsImprovement');
      if (q.scenario.type === 'outsImprovement') {
        expect([3, 4]).toContain(q.scenario.communityCards.length);
        expect(q.scenario.holeCards).toHaveLength(2);
        if (q.scenario.communityCards.length === 3) {
          expect(q.scenario.street).toBe('Flop');
        } else {
          expect(q.scenario.street).toBe('Turn');
        }
      }
    }
  });
});

describe('generatePreflopActionQuestion', () => {
  it('produces valid preflop action questions', () => {
    for (let i = 0; i < 50; i++) {
      const q = generatePreflopActionQuestion();
      validateQuestion(q);
      validateNoDuplicateCards(q);
      expect(q.category).toBe('preflopAction');
      expect(q.scenario.type).toBe('preflopAction');
      if (q.scenario.type === 'preflopAction') {
        expect(q.scenario.holeCards).toHaveLength(2);
        expect(q.scenario.heroStack).toBeGreaterThan(0);
      }
    }
  });
});
