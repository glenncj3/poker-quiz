import { describe, it, expect } from 'vitest';
import { generateHandRankingQuestion } from './handRanking';
import { generateNutsReadingQuestion } from './nutsReading';
import { generateOutsImprovementQuestion } from './outsImprovement';
import { generateBetOrCheckQuestion } from './betOrCheck';
import { generateFoldCallRaiseQuestion } from './foldCallRaise';
import { cardKey } from '../deck';
import type { Question } from '../../types/quiz';

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
});

describe('generateNutsReadingQuestion', () => {
  it('produces valid questions repeatedly', () => {
    for (let i = 0; i < 5; i++) {
      const q = generateNutsReadingQuestion();
      validateQuestion(q);
      expect(q.category).toBe('nutsReading');
      expect(q.scenario.communityCards).toHaveLength(5);
    }
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

describe('generateBetOrCheckQuestion', () => {
  it('produces valid questions repeatedly', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateBetOrCheckQuestion();
      validateQuestion(q);
      validateNoDuplicateCards(q);
      expect(q.category).toBe('betOrCheck');
      expect(q.scenario.communityCards).toHaveLength(5);
      expect(q.scenario.holeCards).toHaveLength(2);
    }
  });
});

describe('generateFoldCallRaiseQuestion', () => {
  it('produces valid questions repeatedly', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateFoldCallRaiseQuestion();
      validateQuestion(q);
      validateNoDuplicateCards(q);
      expect(q.category).toBe('foldCallRaise');
      expect(q.scenario.communityCards).toHaveLength(5);
      expect(q.scenario.holeCards).toHaveLength(2);
      expect(q.scenario.potSize).toBeGreaterThan(0);
      expect(q.scenario.betSize).toBeGreaterThan(0);
    }
  });
});
