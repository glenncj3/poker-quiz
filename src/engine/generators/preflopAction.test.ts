import { describe, it, expect } from 'vitest';
import {
  generatePreflopActionQuestion,
  getPreflopAction,
  ACTION_LABELS,
} from './preflopAction';
import { classifyPreflopHand, PreflopTier } from '../preflop';
import { cardKey } from '../deck';

// ── getPreflopAction ──

describe('getPreflopAction', () => {
  const ALL_POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'] as const;

  it('always bets big with premium hands regardless of position or stack', () => {
    for (const pos of ALL_POSITIONS) {
      expect(getPreflopAction(PreflopTier.Premium, pos, 30)).toBe('betBig');
      expect(getPreflopAction(PreflopTier.Premium, pos, 100)).toBe('betBig');
      expect(getPreflopAction(PreflopTier.Premium, pos, 300)).toBe('betBig');
    }
  });

  it('bets big with strong hands on short stacks', () => {
    expect(getPreflopAction(PreflopTier.Strong, 'UTG', 30)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'CO', 40)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'SB', 35)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'BB', 40)).toBe('betBig');
  });

  it('bets small with strong hands from CO/BTN on normal stacks', () => {
    expect(getPreflopAction(PreflopTier.Strong, 'CO', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.Strong, 'BTN', 200)).toBe('betSmall');
  });

  it('bets big with strong hands from UTG/MP/SB/BB on normal stacks', () => {
    expect(getPreflopAction(PreflopTier.Strong, 'UTG', 100)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'MP', 150)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'SB', 100)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'BB', 100)).toBe('betBig');
  });

  it('raises from all positions with UTG Open hands', () => {
    for (const pos of ALL_POSITIONS) {
      expect(getPreflopAction(PreflopTier.UTGOpen, pos, 100)).toBe('betSmall');
      expect(getPreflopAction(PreflopTier.UTGOpen, pos, 30)).toBe('betBig');
    }
  });

  it('folds MP Open hands from UTG, raises elsewhere', () => {
    expect(getPreflopAction(PreflopTier.MPOpen, 'UTG', 100)).toBe('fold');
    expect(getPreflopAction(PreflopTier.MPOpen, 'UTG', 30)).toBe('fold');
    expect(getPreflopAction(PreflopTier.MPOpen, 'MP', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.MPOpen, 'CO', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.MPOpen, 'BTN', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.MPOpen, 'SB', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.MPOpen, 'BB', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.MPOpen, 'MP', 30)).toBe('betBig');
  });

  it('folds LP Open hands from UTG/MP, raises from CO+', () => {
    expect(getPreflopAction(PreflopTier.LPOpen, 'UTG', 100)).toBe('fold');
    expect(getPreflopAction(PreflopTier.LPOpen, 'MP', 100)).toBe('fold');
    expect(getPreflopAction(PreflopTier.LPOpen, 'CO', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.LPOpen, 'BTN', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.LPOpen, 'SB', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.LPOpen, 'BB', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.LPOpen, 'CO', 30)).toBe('betBig');
  });

  it('raises steal hands from BTN/BB, calls from SB, folds elsewhere', () => {
    expect(getPreflopAction(PreflopTier.Steal, 'UTG', 100)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Steal, 'MP', 100)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Steal, 'CO', 100)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Steal, 'BTN', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.Steal, 'SB', 100)).toBe('call');
    expect(getPreflopAction(PreflopTier.Steal, 'BB', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.Steal, 'BTN', 30)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Steal, 'BB', 30)).toBe('betBig');
  });

  it('folds steal hands from SB on short stacks', () => {
    expect(getPreflopAction(PreflopTier.Steal, 'SB', 30)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Steal, 'SB', 40)).toBe('fold');
  });

  it('always folds trash hands', () => {
    for (const pos of ALL_POSITIONS) {
      expect(getPreflopAction(PreflopTier.Trash, pos, 30)).toBe('fold');
      expect(getPreflopAction(PreflopTier.Trash, pos, 100)).toBe('fold');
      expect(getPreflopAction(PreflopTier.Trash, pos, 300)).toBe('fold');
    }
  });
});

// ── generatePreflopActionQuestion (integration) ──

describe('generatePreflopActionQuestion', () => {
  it('produces valid questions with exactly one correct answer', () => {
    for (let i = 0; i < 20; i++) {
      const q = generatePreflopActionQuestion();
      expect(q.options).toHaveLength(4);
      const correctCount = q.options.filter(o => o.isCorrect).length;
      expect(correctCount).toBe(1);
    }
  });

  it('never has duplicate cards', () => {
    for (let i = 0; i < 20; i++) {
      const q = generatePreflopActionQuestion();
      const keys = q.scenario.holeCards!.map(cardKey);
      expect(new Set(keys).size).toBe(2);
    }
  });

  it('always sets street to Preflop with no community cards', () => {
    for (let i = 0; i < 20; i++) {
      const q = generatePreflopActionQuestion();
      expect(q.scenario.street).toBe('Preflop');
      expect(q.scenario.communityCards).toHaveLength(0);
    }
  });

  it('hero stack is between $30-$300 in $5 increments', () => {
    for (let i = 0; i < 50; i++) {
      const q = generatePreflopActionQuestion();
      const stack = q.scenario.heroStack!;
      expect(stack).toBeGreaterThanOrEqual(30);
      expect(stack).toBeLessThanOrEqual(300);
      expect(stack % 5).toBe(0);
    }
  });

  it('uses valid positions including BB', () => {
    const validPositions = new Set(['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']);
    for (let i = 0; i < 50; i++) {
      const q = generatePreflopActionQuestion();
      expect(validPositions.has(q.scenario.position!)).toBe(true);
    }
  });

  it('has no villain-related fields in scenario', () => {
    for (let i = 0; i < 20; i++) {
      const q = generatePreflopActionQuestion();
      expect(q.scenario.villainStack).toBeUndefined();
      expect(q.scenario.betSize).toBeUndefined();
    }
  });

  it('always has all four option labels', () => {
    const expectedLabels = new Set(Object.values(ACTION_LABELS));
    for (let i = 0; i < 20; i++) {
      const q = generatePreflopActionQuestion();
      const labels = new Set(q.options.map(o => o.label));
      expect(labels).toEqual(expectedLabels);
    }
  });

  it('has non-empty explanation text', () => {
    for (let i = 0; i < 20; i++) {
      const q = generatePreflopActionQuestion();
      expect(q.explanation.length).toBeGreaterThan(10);
    }
  });

  it('question text includes position and stack', () => {
    for (let i = 0; i < 20; i++) {
      const q = generatePreflopActionQuestion();
      expect(q.questionText).toContain(q.scenario.position!);
      expect(q.questionText).toContain(`$${q.scenario.heroStack}`);
    }
  });

  it('generates a hand matching the requested targetTier', () => {
    const tiers = [
      PreflopTier.Trash,
      PreflopTier.Steal,
      PreflopTier.LPOpen,
      PreflopTier.MPOpen,
      PreflopTier.UTGOpen,
      PreflopTier.Strong,
      PreflopTier.Premium,
    ] as const;
    for (const tier of tiers) {
      for (let i = 0; i < 5; i++) {
        const q = generatePreflopActionQuestion({ targetTier: tier });
        const actual = classifyPreflopHand(q.scenario.holeCards!);
        expect(actual).toBe(tier);
      }
    }
  });
});
