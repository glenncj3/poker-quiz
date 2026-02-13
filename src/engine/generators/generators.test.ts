import { describe, it, expect } from 'vitest';
import { generateHandRankingQuestion } from './handRanking';
import { generateNutsReadingQuestion } from './nutsReading';
import { generateOutsImprovementQuestion } from './outsImprovement';
import { generatePreflopActionQuestion } from './preflopAction';
import { cardKey } from '../deck';
import { evaluateHand } from '../evaluator';
import type { Question } from '../../types/quiz';

const VALID_STREETS = ['Preflop', 'Flop', 'Turn', 'River'];

const COMMUNITY_CARD_COUNTS: Record<string, number> = {
  Preflop: 0,
  Flop: 3,
  Turn: 4,
  River: 5,
};

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

function validateNoDuplicateCards(q: Question) {
  const allCards = [
    ...(q.scenario.communityCards || []),
    ...(q.scenario.holeCards || []),
    ...(q.scenario.opponentHands?.flat() || []),
  ];
  const keys = allCards.map(cardKey);
  const unique = new Set(keys);
  expect(unique.size).toBe(keys.length);
}

function validateStreetCards(q: Question) {
  const street = q.scenario.street;
  expect(VALID_STREETS).toContain(street);
  const expectedCC = COMMUNITY_CARD_COUNTS[street!];
  expect(q.scenario.communityCards).toHaveLength(expectedCC);
}

describe('generateHandRankingQuestion', () => {
  it('produces valid questions repeatedly', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateHandRankingQuestion();
      validateQuestion(q);
      validateNoDuplicateCards(q);
      expect(q.category).toBe('handRanking');
      expect(q.scenario.communityCards).toHaveLength(5);
      expect(q.scenario.opponentHands).toHaveLength(4);
    }
  });

  it('all 4 players have distinct hand strengths (no ties)', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateHandRankingQuestion();
      const hands = q.scenario.opponentHands!;
      const community = q.scenario.communityCards;
      const scores = hands.map(hole => evaluateHand(hole, community).score);
      const uniqueScores = new Set(scores);
      expect(uniqueScores.size).toBe(4);
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
      expect(['Flop', 'Turn', 'River']).toContain(q.scenario.street);
      validateStreetCards(q);
      streetsSeen.add(q.scenario.street!);
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
      expect([3, 4]).toContain(q.scenario.communityCards.length);
      expect(q.scenario.holeCards).toHaveLength(2);
      if (q.scenario.communityCards.length === 3) {
        expect(q.scenario.street).toBe('Flop');
      } else {
        expect(q.scenario.street).toBe('Turn');
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
      expect(q.scenario.holeCards).toHaveLength(2);
      expect(q.scenario.communityCards).toHaveLength(0);
      expect(q.scenario.street).toBe('Preflop');
      expect(q.scenario.heroStack).toBeGreaterThan(0);
      expect(q.scenario.villainStack).toBeUndefined();
      expect(q.scenario.betSize).toBeUndefined();
    }
  });
});
