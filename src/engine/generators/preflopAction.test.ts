import { describe, it, expect } from 'vitest';
import {
  generatePreflopActionQuestion,
  getPreflopAction,
  ACTION_LABELS,
} from './preflopAction';
import { PreflopTier } from '../preflop';
import { cardKey } from '../deck';

// ── getPreflopAction ──

describe('getPreflopAction', () => {
  it('always bets big with premium hands regardless of position or stack', () => {
    const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB'] as const;
    for (const pos of positions) {
      expect(getPreflopAction(PreflopTier.Premium, pos, 30)).toBe('betBig');
      expect(getPreflopAction(PreflopTier.Premium, pos, 100)).toBe('betBig');
      expect(getPreflopAction(PreflopTier.Premium, pos, 300)).toBe('betBig');
    }
  });

  it('bets big with strong hands on short stacks', () => {
    expect(getPreflopAction(PreflopTier.Strong, 'UTG', 30)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'CO', 40)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'SB', 35)).toBe('betBig');
  });

  it('bets small with strong hands in late position on normal stacks', () => {
    expect(getPreflopAction(PreflopTier.Strong, 'CO', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.Strong, 'BTN', 200)).toBe('betSmall');
  });

  it('bets big with strong hands in EP/SB on normal stacks', () => {
    expect(getPreflopAction(PreflopTier.Strong, 'UTG', 100)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'MP', 150)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Strong, 'SB', 100)).toBe('betBig');
  });

  it('folds playable hands from early position regardless of stack', () => {
    expect(getPreflopAction(PreflopTier.Playable, 'UTG', 30)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Playable, 'UTG', 100)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Playable, 'MP', 200)).toBe('fold');
  });

  it('bets big with playable hands on short stacks (non-EP)', () => {
    expect(getPreflopAction(PreflopTier.Playable, 'CO', 35)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Playable, 'BTN', 40)).toBe('betBig');
    expect(getPreflopAction(PreflopTier.Playable, 'SB', 30)).toBe('betBig');
  });

  it('bets small with playable hands in LP/SB on normal stacks', () => {
    expect(getPreflopAction(PreflopTier.Playable, 'CO', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.Playable, 'BTN', 200)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.Playable, 'SB', 150)).toBe('betSmall');
  });

  it('folds marginal hands on short stacks everywhere', () => {
    expect(getPreflopAction(PreflopTier.Marginal, 'UTG', 30)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Marginal, 'BTN', 40)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Marginal, 'SB', 35)).toBe('fold');
  });

  it('bets small with marginal hands from BTN on normal stacks', () => {
    expect(getPreflopAction(PreflopTier.Marginal, 'BTN', 100)).toBe('betSmall');
    expect(getPreflopAction(PreflopTier.Marginal, 'BTN', 200)).toBe('betSmall');
  });

  it('calls with marginal hands from SB on normal stacks', () => {
    expect(getPreflopAction(PreflopTier.Marginal, 'SB', 100)).toBe('call');
    expect(getPreflopAction(PreflopTier.Marginal, 'SB', 200)).toBe('call');
  });

  it('folds marginal hands from EP/CO on normal stacks', () => {
    expect(getPreflopAction(PreflopTier.Marginal, 'UTG', 100)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Marginal, 'MP', 200)).toBe('fold');
    expect(getPreflopAction(PreflopTier.Marginal, 'CO', 100)).toBe('fold');
  });

  it('always folds weak hands', () => {
    const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB'] as const;
    for (const pos of positions) {
      expect(getPreflopAction(PreflopTier.Weak, pos, 30)).toBe('fold');
      expect(getPreflopAction(PreflopTier.Weak, pos, 100)).toBe('fold');
      expect(getPreflopAction(PreflopTier.Weak, pos, 300)).toBe('fold');
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

  it('uses valid positions (not BB)', () => {
    const validPositions = new Set(['UTG', 'MP', 'CO', 'BTN', 'SB']);
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
});
