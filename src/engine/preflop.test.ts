import { describe, it, expect } from 'vitest';
import { handNotation, classifyPreflopHand, PreflopTier } from './preflop';
import type { Card } from '../types/card';

function c(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

describe('handNotation', () => {
  it('returns pair notation for pocket pairs', () => {
    expect(handNotation([c('A', 'spades'), c('A', 'hearts')])).toBe('AA');
    expect(handNotation([c('K', 'clubs'), c('K', 'diamonds')])).toBe('KK');
    expect(handNotation([c('2', 'hearts'), c('2', 'spades')])).toBe('22');
    expect(handNotation([c('10', 'hearts'), c('10', 'spades')])).toBe('TT');
  });

  it('returns suited notation for same-suit hands', () => {
    expect(handNotation([c('A', 'spades'), c('K', 'spades')])).toBe('AKs');
    expect(handNotation([c('Q', 'hearts'), c('J', 'hearts')])).toBe('QJs');
    expect(handNotation([c('10', 'diamonds'), c('9', 'diamonds')])).toBe('T9s');
  });

  it('returns offsuit notation for different-suit hands', () => {
    expect(handNotation([c('A', 'spades'), c('K', 'hearts')])).toBe('AKo');
    expect(handNotation([c('Q', 'clubs'), c('J', 'diamonds')])).toBe('QJo');
    expect(handNotation([c('10', 'hearts'), c('9', 'clubs')])).toBe('T9o');
  });

  it('always puts the higher rank first', () => {
    // Reversed order input
    expect(handNotation([c('K', 'spades'), c('A', 'spades')])).toBe('AKs');
    expect(handNotation([c('2', 'hearts'), c('A', 'clubs')])).toBe('A2o');
    expect(handNotation([c('9', 'diamonds'), c('10', 'diamonds')])).toBe('T9s');
  });

  it('converts 10 to T in notation', () => {
    expect(handNotation([c('10', 'spades'), c('J', 'spades')])).toBe('JTs');
  });
});

describe('classifyPreflopHand', () => {
  it('classifies premium hands', () => {
    expect(classifyPreflopHand([c('A', 'spades'), c('A', 'hearts')])).toBe(PreflopTier.Premium);
    expect(classifyPreflopHand([c('K', 'spades'), c('K', 'hearts')])).toBe(PreflopTier.Premium);
    expect(classifyPreflopHand([c('Q', 'spades'), c('Q', 'hearts')])).toBe(PreflopTier.Premium);
    expect(classifyPreflopHand([c('A', 'spades'), c('K', 'spades')])).toBe(PreflopTier.Premium);
  });

  it('classifies strong hands', () => {
    expect(classifyPreflopHand([c('J', 'spades'), c('J', 'hearts')])).toBe(PreflopTier.Strong);
    expect(classifyPreflopHand([c('10', 'spades'), c('10', 'hearts')])).toBe(PreflopTier.Strong);
    expect(classifyPreflopHand([c('A', 'hearts'), c('Q', 'hearts')])).toBe(PreflopTier.Strong);
    expect(classifyPreflopHand([c('A', 'spades'), c('K', 'hearts')])).toBe(PreflopTier.Strong); // AKo
    expect(classifyPreflopHand([c('A', 'spades'), c('Q', 'hearts')])).toBe(PreflopTier.Strong); // AQo
    expect(classifyPreflopHand([c('K', 'spades'), c('Q', 'spades')])).toBe(PreflopTier.Strong);
  });

  it('classifies UTG open hands', () => {
    expect(classifyPreflopHand([c('9', 'spades'), c('9', 'hearts')])).toBe(PreflopTier.UTGOpen);
    expect(classifyPreflopHand([c('8', 'spades'), c('8', 'hearts')])).toBe(PreflopTier.UTGOpen);
    expect(classifyPreflopHand([c('A', 'hearts'), c('10', 'hearts')])).toBe(PreflopTier.UTGOpen); // ATs
    expect(classifyPreflopHand([c('J', 'diamonds'), c('10', 'diamonds')])).toBe(PreflopTier.UTGOpen); // JTs
    expect(classifyPreflopHand([c('A', 'spades'), c('J', 'hearts')])).toBe(PreflopTier.UTGOpen); // AJo
  });

  it('classifies MP open hands', () => {
    expect(classifyPreflopHand([c('7', 'spades'), c('7', 'hearts')])).toBe(PreflopTier.MPOpen);
    expect(classifyPreflopHand([c('6', 'spades'), c('6', 'hearts')])).toBe(PreflopTier.MPOpen);
    expect(classifyPreflopHand([c('A', 'hearts'), c('9', 'hearts')])).toBe(PreflopTier.MPOpen); // A9s
    expect(classifyPreflopHand([c('9', 'diamonds'), c('8', 'diamonds')])).toBe(PreflopTier.MPOpen); // 98s
    expect(classifyPreflopHand([c('K', 'spades'), c('Q', 'hearts')])).toBe(PreflopTier.MPOpen); // KQo
  });

  it('classifies LP open hands', () => {
    expect(classifyPreflopHand([c('5', 'spades'), c('5', 'hearts')])).toBe(PreflopTier.LPOpen);
    expect(classifyPreflopHand([c('4', 'spades'), c('4', 'hearts')])).toBe(PreflopTier.LPOpen);
    expect(classifyPreflopHand([c('A', 'hearts'), c('4', 'hearts')])).toBe(PreflopTier.LPOpen); // A4s
    expect(classifyPreflopHand([c('7', 'diamonds'), c('6', 'diamonds')])).toBe(PreflopTier.LPOpen); // 76s
    expect(classifyPreflopHand([c('K', 'spades'), c('10', 'hearts')])).toBe(PreflopTier.LPOpen); // KTo
  });

  it('classifies steal hands', () => {
    expect(classifyPreflopHand([c('3', 'spades'), c('3', 'hearts')])).toBe(PreflopTier.Steal);
    expect(classifyPreflopHand([c('2', 'spades'), c('2', 'hearts')])).toBe(PreflopTier.Steal);
    expect(classifyPreflopHand([c('K', 'hearts'), c('5', 'hearts')])).toBe(PreflopTier.Steal); // K5s
    expect(classifyPreflopHand([c('Q', 'spades'), c('10', 'hearts')])).toBe(PreflopTier.Steal); // QTo
    expect(classifyPreflopHand([c('A', 'spades'), c('9', 'hearts')])).toBe(PreflopTier.Steal); // A9o
  });

  it('classifies trash hands', () => {
    expect(classifyPreflopHand([c('7', 'spades'), c('2', 'hearts')])).toBe(PreflopTier.Trash);
    expect(classifyPreflopHand([c('9', 'clubs'), c('3', 'hearts')])).toBe(PreflopTier.Trash);
    expect(classifyPreflopHand([c('8', 'spades'), c('2', 'diamonds')])).toBe(PreflopTier.Trash);
    expect(classifyPreflopHand([c('J', 'spades'), c('4', 'hearts')])).toBe(PreflopTier.Trash);
  });

  it('distinguishes suited vs offsuit for tier boundaries', () => {
    // AKs is Premium, AKo is Strong
    expect(classifyPreflopHand([c('A', 'spades'), c('K', 'spades')])).toBe(PreflopTier.Premium);
    expect(classifyPreflopHand([c('A', 'spades'), c('K', 'hearts')])).toBe(PreflopTier.Strong);
  });
});
