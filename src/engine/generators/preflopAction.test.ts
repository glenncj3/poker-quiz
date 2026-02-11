import { describe, it, expect } from 'vitest';
import {
  generatePreflopActionQuestion,
  getRfiAction,
  getFacingRaiseAction,
  heroIsIP,
} from './preflopAction';
import { PreflopTier } from '../preflop';
import { cardKey } from '../deck';

// ── getRfiAction ──

describe('getRfiAction', () => {
  it('always raises big with premium hands regardless of position or stack', () => {
    const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB'] as const;
    for (const pos of positions) {
      expect(getRfiAction(PreflopTier.Premium, pos, 30)).toBe('raiseBig');
      expect(getRfiAction(PreflopTier.Premium, pos, 100)).toBe('raiseBig');
      expect(getRfiAction(PreflopTier.Premium, pos, 300)).toBe('raiseBig');
    }
  });

  it('raises big with strong hands on short stacks', () => {
    expect(getRfiAction(PreflopTier.Strong, 'UTG', 30)).toBe('raiseBig');
    expect(getRfiAction(PreflopTier.Strong, 'CO', 40)).toBe('raiseBig');
  });

  it('raises small with strong hands in late position on normal stacks', () => {
    expect(getRfiAction(PreflopTier.Strong, 'CO', 100)).toBe('raiseSmall');
    expect(getRfiAction(PreflopTier.Strong, 'BTN', 200)).toBe('raiseSmall');
  });

  it('raises big with strong hands in EP/SB on normal stacks', () => {
    expect(getRfiAction(PreflopTier.Strong, 'UTG', 100)).toBe('raiseBig');
    expect(getRfiAction(PreflopTier.Strong, 'MP', 150)).toBe('raiseBig');
    expect(getRfiAction(PreflopTier.Strong, 'SB', 100)).toBe('raiseBig');
  });

  it('folds playable hands from early position', () => {
    expect(getRfiAction(PreflopTier.Playable, 'UTG', 100)).toBe('fold');
    expect(getRfiAction(PreflopTier.Playable, 'MP', 200)).toBe('fold');
  });

  it('raises big with playable hands on short stacks (non-EP)', () => {
    expect(getRfiAction(PreflopTier.Playable, 'CO', 35)).toBe('raiseBig');
    expect(getRfiAction(PreflopTier.Playable, 'BTN', 40)).toBe('raiseBig');
  });

  it('raises small with playable hands in LP/SB on normal stacks', () => {
    expect(getRfiAction(PreflopTier.Playable, 'CO', 100)).toBe('raiseSmall');
    expect(getRfiAction(PreflopTier.Playable, 'BTN', 200)).toBe('raiseSmall');
    expect(getRfiAction(PreflopTier.Playable, 'SB', 150)).toBe('raiseSmall');
  });

  it('opens marginal hands only from the BTN', () => {
    expect(getRfiAction(PreflopTier.Marginal, 'BTN', 100)).toBe('raiseSmall');
    expect(getRfiAction(PreflopTier.Marginal, 'BTN', 30)).toBe('raiseBig');
    expect(getRfiAction(PreflopTier.Marginal, 'UTG', 100)).toBe('fold');
    expect(getRfiAction(PreflopTier.Marginal, 'CO', 200)).toBe('fold');
    expect(getRfiAction(PreflopTier.Marginal, 'SB', 100)).toBe('fold');
  });

  it('always folds weak hands', () => {
    const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB'] as const;
    for (const pos of positions) {
      expect(getRfiAction(PreflopTier.Weak, pos, 100)).toBe('fold');
    }
  });
});

// ── getFacingRaiseAction ──

describe('getFacingRaiseAction', () => {
  it('always 3-bets big with premium hands', () => {
    expect(getFacingRaiseAction(PreflopTier.Premium, true, 100)).toBe('reraiseBig');
    expect(getFacingRaiseAction(PreflopTier.Premium, false, 30)).toBe('reraiseBig');
    expect(getFacingRaiseAction(PreflopTier.Premium, true, 200)).toBe('reraiseBig');
  });

  it('3-bets big with strong hands on short stacks', () => {
    expect(getFacingRaiseAction(PreflopTier.Strong, true, 30)).toBe('reraiseBig');
    expect(getFacingRaiseAction(PreflopTier.Strong, false, 40)).toBe('reraiseBig');
  });

  it('3-bets small with strong hands IP on normal stacks', () => {
    expect(getFacingRaiseAction(PreflopTier.Strong, true, 100)).toBe('reraiseSmall');
  });

  it('3-bets big with strong hands OOP on normal stacks', () => {
    expect(getFacingRaiseAction(PreflopTier.Strong, false, 100)).toBe('reraiseBig');
  });

  it('folds playable hands on short stacks', () => {
    expect(getFacingRaiseAction(PreflopTier.Playable, true, 30)).toBe('fold');
    expect(getFacingRaiseAction(PreflopTier.Playable, false, 40)).toBe('fold');
  });

  it('calls with playable hands IP on normal stacks', () => {
    expect(getFacingRaiseAction(PreflopTier.Playable, true, 100)).toBe('call');
    expect(getFacingRaiseAction(PreflopTier.Playable, true, 200)).toBe('call');
  });

  it('folds playable hands OOP on normal stacks', () => {
    expect(getFacingRaiseAction(PreflopTier.Playable, false, 100)).toBe('fold');
  });

  it('always folds marginal hands', () => {
    expect(getFacingRaiseAction(PreflopTier.Marginal, true, 100)).toBe('fold');
    expect(getFacingRaiseAction(PreflopTier.Marginal, false, 200)).toBe('fold');
  });

  it('always folds weak hands', () => {
    expect(getFacingRaiseAction(PreflopTier.Weak, true, 100)).toBe('fold');
    expect(getFacingRaiseAction(PreflopTier.Weak, false, 200)).toBe('fold');
  });
});

// ── heroIsIP ──

describe('heroIsIP', () => {
  it('BTN is in position vs all other positions', () => {
    expect(heroIsIP('BTN', 'SB')).toBe(true);
    expect(heroIsIP('BTN', 'BB')).toBe(true);
    expect(heroIsIP('BTN', 'UTG')).toBe(true);
    expect(heroIsIP('BTN', 'MP')).toBe(true);
    expect(heroIsIP('BTN', 'CO')).toBe(true);
  });

  it('SB is out of position vs everyone', () => {
    expect(heroIsIP('SB', 'BB')).toBe(false);
    expect(heroIsIP('SB', 'UTG')).toBe(false);
    expect(heroIsIP('SB', 'BTN')).toBe(false);
  });

  it('BB is out of position vs UTG and later', () => {
    expect(heroIsIP('BB', 'UTG')).toBe(false);
    expect(heroIsIP('BB', 'CO')).toBe(false);
    expect(heroIsIP('BB', 'BTN')).toBe(false);
  });

  it('BB is in position vs SB', () => {
    expect(heroIsIP('BB', 'SB')).toBe(true);
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

  it('RFI scenarios have valid positions (not BB)', () => {
    const rfiPositions = new Set(['UTG', 'MP', 'CO', 'BTN', 'SB']);
    for (let i = 0; i < 50; i++) {
      const q = generatePreflopActionQuestion();
      if (!q.scenario.villainStack) {
        // RFI scenario
        expect(rfiPositions.has(q.scenario.position!)).toBe(true);
      }
    }
  });

  it('facing-raise scenarios have villainStack, betSize, and valid positions', () => {
    const facingPositions = new Set(['MP', 'CO', 'BTN', 'SB', 'BB']);
    for (let i = 0; i < 50; i++) {
      const q = generatePreflopActionQuestion();
      if (q.scenario.villainStack) {
        expect(q.scenario.betSize).toBeGreaterThanOrEqual(5);
        expect(q.scenario.betSize).toBeLessThanOrEqual(8);
        expect(facingPositions.has(q.scenario.position!)).toBe(true);
      }
    }
  });

  it('RFI options always include Limp as an incorrect trap option', () => {
    for (let i = 0; i < 50; i++) {
      const q = generatePreflopActionQuestion();
      if (!q.scenario.villainStack) {
        const limpOption = q.options.find(o => o.id === 'limp');
        expect(limpOption).toBeDefined();
        expect(limpOption!.isCorrect).toBe(false);
      }
    }
  });

  it('has non-empty explanation text', () => {
    for (let i = 0; i < 20; i++) {
      const q = generatePreflopActionQuestion();
      expect(q.explanation.length).toBeGreaterThan(10);
    }
  });

  it('produces both RFI and facing-raise scenarios', () => {
    let rfi = 0;
    let facing = 0;
    for (let i = 0; i < 50; i++) {
      const q = generatePreflopActionQuestion();
      if (q.scenario.villainStack) facing++;
      else rfi++;
    }
    expect(rfi).toBeGreaterThan(0);
    expect(facing).toBeGreaterThan(0);
  });
});
