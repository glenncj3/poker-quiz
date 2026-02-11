import { describe, it, expect } from 'vitest';
import { evaluate5, evaluateHand, combinations } from './evaluator';
import { HandType } from '../types/card';
import type { Card } from '../types/card';

function c(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

describe('combinations', () => {
  it('generates correct count', () => {
    expect(combinations([1, 2, 3, 4, 5], 2)).toHaveLength(10);
    expect(combinations([1, 2, 3, 4, 5, 6, 7], 5)).toHaveLength(21);
  });
});

describe('evaluate5', () => {
  it('detects Royal Flush', () => {
    const hand = evaluate5([
      c('A', 'spades'), c('K', 'spades'), c('Q', 'spades'), c('J', 'spades'), c('10', 'spades'),
    ]);
    expect(hand.type).toBe(HandType.RoyalFlush);
  });

  it('detects Straight Flush', () => {
    const hand = evaluate5([
      c('9', 'hearts'), c('8', 'hearts'), c('7', 'hearts'), c('6', 'hearts'), c('5', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.StraightFlush);
  });

  it('detects Ace-low Straight Flush (wheel flush)', () => {
    const hand = evaluate5([
      c('A', 'clubs'), c('2', 'clubs'), c('3', 'clubs'), c('4', 'clubs'), c('5', 'clubs'),
    ]);
    expect(hand.type).toBe(HandType.StraightFlush);
    expect(hand.score).toBeLessThan(
      evaluate5([c('6', 'clubs'), c('2', 'clubs'), c('3', 'clubs'), c('4', 'clubs'), c('5', 'clubs')]).score
    );
  });

  it('detects Four of a Kind', () => {
    const hand = evaluate5([
      c('K', 'spades'), c('K', 'hearts'), c('K', 'diamonds'), c('K', 'clubs'), c('3', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.FourOfAKind);
  });

  it('detects Full House', () => {
    const hand = evaluate5([
      c('J', 'spades'), c('J', 'hearts'), c('J', 'diamonds'), c('5', 'clubs'), c('5', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.FullHouse);
  });

  it('detects Flush', () => {
    const hand = evaluate5([
      c('A', 'diamonds'), c('9', 'diamonds'), c('7', 'diamonds'), c('4', 'diamonds'), c('2', 'diamonds'),
    ]);
    expect(hand.type).toBe(HandType.Flush);
  });

  it('detects Straight', () => {
    const hand = evaluate5([
      c('8', 'spades'), c('7', 'hearts'), c('6', 'diamonds'), c('5', 'clubs'), c('4', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.Straight);
  });

  it('detects Ace-low Straight (wheel)', () => {
    const hand = evaluate5([
      c('A', 'spades'), c('2', 'hearts'), c('3', 'diamonds'), c('4', 'clubs'), c('5', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.Straight);
    // Wheel should be lower than 6-high straight
    const sixHigh = evaluate5([
      c('6', 'spades'), c('2', 'hearts'), c('3', 'diamonds'), c('4', 'clubs'), c('5', 'hearts'),
    ]);
    expect(hand.score).toBeLessThan(sixHigh.score);
  });

  it('detects Three of a Kind', () => {
    const hand = evaluate5([
      c('7', 'spades'), c('7', 'hearts'), c('7', 'diamonds'), c('K', 'clubs'), c('2', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.ThreeOfAKind);
  });

  it('detects Two Pair', () => {
    const hand = evaluate5([
      c('Q', 'spades'), c('Q', 'hearts'), c('8', 'diamonds'), c('8', 'clubs'), c('3', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.TwoPair);
  });

  it('detects Pair', () => {
    const hand = evaluate5([
      c('10', 'spades'), c('10', 'hearts'), c('A', 'diamonds'), c('7', 'clubs'), c('3', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.Pair);
  });

  it('detects High Card', () => {
    const hand = evaluate5([
      c('A', 'spades'), c('J', 'hearts'), c('8', 'diamonds'), c('5', 'clubs'), c('3', 'hearts'),
    ]);
    expect(hand.type).toBe(HandType.HighCard);
  });

  it('correctly ranks hands (Royal > Straight Flush > ... > High Card)', () => {
    const royal = evaluate5([c('A', 'spades'), c('K', 'spades'), c('Q', 'spades'), c('J', 'spades'), c('10', 'spades')]);
    const sf = evaluate5([c('9', 'hearts'), c('8', 'hearts'), c('7', 'hearts'), c('6', 'hearts'), c('5', 'hearts')]);
    const quads = evaluate5([c('K', 'spades'), c('K', 'hearts'), c('K', 'diamonds'), c('K', 'clubs'), c('3', 'hearts')]);
    const fh = evaluate5([c('J', 'spades'), c('J', 'hearts'), c('J', 'diamonds'), c('5', 'clubs'), c('5', 'hearts')]);
    const flush = evaluate5([c('A', 'diamonds'), c('9', 'diamonds'), c('7', 'diamonds'), c('4', 'diamonds'), c('2', 'diamonds')]);
    const straight = evaluate5([c('8', 'spades'), c('7', 'hearts'), c('6', 'diamonds'), c('5', 'clubs'), c('4', 'hearts')]);
    const trips = evaluate5([c('7', 'spades'), c('7', 'hearts'), c('7', 'diamonds'), c('K', 'clubs'), c('2', 'hearts')]);
    const twoPair = evaluate5([c('Q', 'spades'), c('Q', 'hearts'), c('8', 'diamonds'), c('8', 'clubs'), c('3', 'hearts')]);
    const pair = evaluate5([c('10', 'spades'), c('10', 'hearts'), c('A', 'diamonds'), c('7', 'clubs'), c('3', 'hearts')]);
    const high = evaluate5([c('A', 'spades'), c('J', 'hearts'), c('8', 'diamonds'), c('5', 'clubs'), c('3', 'hearts')]);

    expect(royal.score).toBeGreaterThan(sf.score);
    expect(sf.score).toBeGreaterThan(quads.score);
    expect(quads.score).toBeGreaterThan(fh.score);
    expect(fh.score).toBeGreaterThan(flush.score);
    expect(flush.score).toBeGreaterThan(straight.score);
    expect(straight.score).toBeGreaterThan(trips.score);
    expect(trips.score).toBeGreaterThan(twoPair.score);
    expect(twoPair.score).toBeGreaterThan(pair.score);
    expect(pair.score).toBeGreaterThan(high.score);
  });

  it('compares kickers correctly for pairs', () => {
    const pairAcesHighKicker = evaluate5([
      c('A', 'spades'), c('A', 'hearts'), c('K', 'diamonds'), c('7', 'clubs'), c('3', 'hearts'),
    ]);
    const pairAcesLowKicker = evaluate5([
      c('A', 'diamonds'), c('A', 'clubs'), c('Q', 'spades'), c('7', 'hearts'), c('3', 'diamonds'),
    ]);
    expect(pairAcesHighKicker.score).toBeGreaterThan(pairAcesLowKicker.score);
  });
});

describe('evaluateHand (7 cards)', () => {
  it('picks the best 5-card hand from 7 cards', () => {
    // Hole: A♠ K♠, Community: Q♠ J♠ 10♠ 3♥ 7♦ — should find Royal Flush
    const hand = evaluateHand(
      [c('A', 'spades'), c('K', 'spades')],
      [c('Q', 'spades'), c('J', 'spades'), c('10', 'spades'), c('3', 'hearts'), c('7', 'diamonds')],
    );
    expect(hand.type).toBe(HandType.RoyalFlush);
  });

  it('finds full house over two pair in 7 cards', () => {
    // Hole: K♠ K♥, Community: K♦ 8♣ 8♠ 3♥ 2♦
    const hand = evaluateHand(
      [c('K', 'spades'), c('K', 'hearts')],
      [c('K', 'diamonds'), c('8', 'clubs'), c('8', 'spades'), c('3', 'hearts'), c('2', 'diamonds')],
    );
    expect(hand.type).toBe(HandType.FullHouse);
  });
});
