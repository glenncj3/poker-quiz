import { describe, it, expect } from 'vitest';
import { findNuts, findTopNHands } from './nuts';
import { HandType } from '../types/card';
import type { Card } from '../types/card';

function c(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

describe('findNuts', () => {
  it('finds royal flush as nuts on Broadway board', () => {
    // Board: A♠ K♠ Q♠ J♠ 2♥ — nuts is 10♠ + any for Royal Flush
    const community = [
      c('A', 'spades'), c('K', 'spades'), c('Q', 'spades'), c('J', 'spades'), c('2', 'hearts'),
    ];
    const result = findNuts(community);
    expect(result.hand.type).toBe(HandType.RoyalFlush);
    // One of the hole cards must be 10♠
    const has10Spades = result.holeCards.some(
      card => card.rank === '10' && card.suit === 'spades'
    );
    expect(has10Spades).toBe(true);
  });

  it('finds four of a kind as nuts on paired board', () => {
    // Board: K♠ K♥ 7♦ 3♣ 2♠ — nuts is K♦K♣ for quad Kings
    const community = [
      c('K', 'spades'), c('K', 'hearts'), c('7', 'diamonds'), c('3', 'clubs'), c('2', 'spades'),
    ];
    const result = findNuts(community);
    expect(result.hand.type).toBe(HandType.FourOfAKind);
  });

  it('returns exactly 2 hole cards', () => {
    const community = [
      c('A', 'hearts'), c('K', 'hearts'), c('Q', 'hearts'), c('J', 'hearts'), c('9', 'clubs'),
    ];
    const result = findNuts(community);
    expect(result.holeCards).toHaveLength(2);
  });

  it('hole cards do not overlap with community cards', () => {
    const community = [
      c('10', 'spades'), c('9', 'spades'), c('8', 'spades'), c('3', 'hearts'), c('2', 'diamonds'),
    ];
    const result = findNuts(community);
    for (const hole of result.holeCards) {
      const overlap = community.some(
        cc => cc.rank === hole.rank && cc.suit === hole.suit
      );
      expect(overlap).toBe(false);
    }
  });
});

describe('findTopNHands', () => {
  it('returns the requested number of distinct hand strengths', () => {
    const community = [
      c('A', 'spades'), c('K', 'diamonds'), c('Q', 'hearts'), c('J', 'clubs'), c('2', 'spades'),
    ];
    const top3 = findTopNHands(community, 3);
    expect(top3).toHaveLength(3);
  });

  it('returns results in descending score order', () => {
    const community = [
      c('A', 'spades'), c('K', 'diamonds'), c('Q', 'hearts'), c('J', 'clubs'), c('2', 'spades'),
    ];
    const top5 = findTopNHands(community, 5);
    for (let i = 1; i < top5.length; i++) {
      expect(top5[i - 1].hand.score).toBeGreaterThan(top5[i].hand.score);
    }
  });

  it('returns unique scores (no duplicates)', () => {
    const community = [
      c('A', 'hearts'), c('K', 'hearts'), c('Q', 'hearts'), c('J', 'hearts'), c('5', 'clubs'),
    ];
    const top4 = findTopNHands(community, 4);
    const scores = top4.map(r => r.hand.score);
    expect(new Set(scores).size).toBe(scores.length);
  });

  it('first result matches findNuts', () => {
    const community = [
      c('10', 'spades'), c('9', 'spades'), c('8', 'spades'), c('3', 'hearts'), c('2', 'diamonds'),
    ];
    const nuts = findNuts(community);
    const top1 = findTopNHands(community, 1);
    expect(top1[0].hand.score).toBe(nuts.hand.score);
    expect(top1[0].hand.type).toBe(nuts.hand.type);
  });

  it('each result has exactly 2 hole cards', () => {
    const community = [
      c('A', 'spades'), c('K', 'diamonds'), c('Q', 'hearts'), c('J', 'clubs'), c('2', 'spades'),
    ];
    const top3 = findTopNHands(community, 3);
    for (const entry of top3) {
      expect(entry.holeCards).toHaveLength(2);
    }
  });
});
