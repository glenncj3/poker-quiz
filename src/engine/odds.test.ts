import { describe, it, expect } from 'vitest';
import { calculatePotOdds } from './odds';

describe('calculatePotOdds', () => {
  it('calculates correct ratio for simple pot odds', () => {
    // Pot $100, bet $50 => total pot $150, ratio 3.0:1
    const result = calculatePotOdds(100, 50);
    expect(result.ratio).toBe('3.0:1');
  });

  it('calculates correct percentage for simple pot odds', () => {
    // Pot $100, bet $50 => 50/150 = 33.3%
    const result = calculatePotOdds(100, 50);
    expect(result.percentage).toBe(33.3);
  });

  it('handles equal pot and bet sizes', () => {
    // Pot $100, bet $100 => total pot $200, ratio 2.0:1, percentage 50%
    const result = calculatePotOdds(100, 100);
    expect(result.ratio).toBe('2.0:1');
    expect(result.percentage).toBe(50);
  });

  it('handles small bet relative to pot', () => {
    // Pot $100, bet $10 => total pot $110, ratio 11.0:1, percentage ~9.1%
    const result = calculatePotOdds(100, 10);
    expect(result.ratio).toBe('11.0:1');
    expect(result.percentage).toBe(9.1);
  });

  it('handles large bet relative to pot (overbet)', () => {
    // Pot $50, bet $100 => total pot $150, ratio 1.5:1, percentage ~66.7%
    const result = calculatePotOdds(50, 100);
    expect(result.ratio).toBe('1.5:1');
    expect(result.percentage).toBe(66.7);
  });

  it('handles pot of zero', () => {
    // Pot $0, bet $50 => total pot $50, ratio 1.0:1, percentage 100%
    const result = calculatePotOdds(0, 50);
    expect(result.ratio).toBe('1.0:1');
    expect(result.percentage).toBe(100);
  });

  it('rounds percentage to one decimal place', () => {
    // Pot $200, bet $30 => total pot $230, 30/230 = 13.0434...%
    const result = calculatePotOdds(200, 30);
    const decimalPlaces = result.percentage.toString().split('.')[1]?.length ?? 0;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });
});
