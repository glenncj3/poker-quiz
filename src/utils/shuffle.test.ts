import { describe, it, expect } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it('contains the same elements', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffle(input);
    expect(result.sort((a, b) => a - b)).toEqual(input.sort((a, b) => a - b));
  });

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it('returns a new array reference', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).not.toBe(input);
  });

  it('handles empty array', () => {
    const result = shuffle([]);
    expect(result).toEqual([]);
  });

  it('handles single element array', () => {
    const result = shuffle([42]);
    expect(result).toEqual([42]);
  });

  it('eventually produces different orderings (randomness check)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(shuffle(input).join(','));
    }
    // With 10 elements, extremely unlikely to get the same order 50 times
    expect(results.size).toBeGreaterThan(1);
  });
});
