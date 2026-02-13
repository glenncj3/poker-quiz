import { describe, it, expect } from 'vitest';
import { findOuts } from './outs';
import { HandType } from '../types/card';
import type { Card } from '../types/card';

function c(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

describe('findOuts', () => {
  it('finds flush draw outs (9 outs on flop)', () => {
    // Hole: A♥ K♥, Board: 7♥ 4♥ 2♠ — need any heart for flush (9 remaining hearts)
    const hole = [c('A', 'hearts'), c('K', 'hearts')];
    const community = [c('7', 'hearts'), c('4', 'hearts'), c('2', 'spades')];
    const outs = findOuts(hole, community);
    const flushOuts = outs.filter(o => o.newHandType === HandType.Flush);
    expect(flushOuts.length).toBe(9);
    // All flush outs should be hearts
    for (const out of flushOuts) {
      expect(out.card.suit).toBe('hearts');
    }
  });

  it('finds open-ended straight draw outs', () => {
    // Hole: 9♠ 8♣, Board: 7♦ 6♥ 2♠ — need a 5 or 10 for straight (8 outs)
    const hole = [c('9', 'spades'), c('8', 'clubs')];
    const community = [c('7', 'diamonds'), c('6', 'hearts'), c('2', 'spades')];
    const outs = findOuts(hole, community);
    const straightOuts = outs.filter(o => o.newHandType === HandType.Straight);
    expect(straightOuts.length).toBe(8);
    const outRanks = new Set(straightOuts.map(o => o.card.rank));
    expect(outRanks).toEqual(new Set(['5', '10']));
  });

  it('finds gutshot straight draw outs (4 outs)', () => {
    // Hole: J♠ 10♣, Board: 8♦ 7♥ 2♠ — need a 9 for straight (4 outs)
    const hole = [c('J', 'spades'), c('10', 'clubs')];
    const community = [c('8', 'diamonds'), c('7', 'hearts'), c('2', 'spades')];
    const outs = findOuts(hole, community);
    const straightOuts = outs.filter(o => o.newHandType === HandType.Straight);
    expect(straightOuts.length).toBe(4);
    for (const out of straightOuts) {
      expect(out.card.rank).toBe('9');
    }
  });

  it('returns empty array when hand cannot improve in type', () => {
    // Hole: A♠ A♥, Board: A♦ A♣ K♠ K♥ Q♦ — quad aces, nothing improves the hand type
    const hole = [c('A', 'spades'), c('A', 'hearts')];
    const community = [c('A', 'diamonds'), c('A', 'clubs'), c('K', 'spades'), c('K', 'hearts'), c('Q', 'diamonds')];
    const outs = findOuts(hole, community);
    expect(outs).toHaveLength(0);
  });

  it('outs have positive improvement delta', () => {
    const hole = [c('A', 'hearts'), c('K', 'hearts')];
    const community = [c('7', 'hearts'), c('4', 'hearts'), c('2', 'spades')];
    const outs = findOuts(hole, community);
    for (const out of outs) {
      expect(out.improvementDelta).toBeGreaterThan(0);
    }
  });

  it('outs are sorted by improvement delta descending', () => {
    const hole = [c('A', 'hearts'), c('K', 'hearts')];
    const community = [c('7', 'hearts'), c('4', 'hearts'), c('2', 'spades')];
    const outs = findOuts(hole, community);
    for (let i = 1; i < outs.length; i++) {
      expect(outs[i - 1].improvementDelta).toBeGreaterThanOrEqual(outs[i].improvementDelta);
    }
  });

  it('out cards do not overlap with hole or community cards', () => {
    const hole = [c('A', 'hearts'), c('K', 'hearts')];
    const community = [c('7', 'hearts'), c('4', 'hearts'), c('2', 'spades')];
    const used = new Set([...hole, ...community].map(c => `${c.rank}_${c.suit}`));
    const outs = findOuts(hole, community);
    for (const out of outs) {
      expect(used.has(`${out.card.rank}_${out.card.suit}`)).toBe(false);
    }
  });

  it('each out has a valid newHandName', () => {
    const hole = [c('9', 'spades'), c('8', 'clubs')];
    const community = [c('7', 'diamonds'), c('6', 'hearts'), c('2', 'spades')];
    const outs = findOuts(hole, community);
    for (const out of outs) {
      expect(out.newHandName).toBeTruthy();
      expect(typeof out.newHandName).toBe('string');
    }
  });

  it('ranks straight flush above flush when both are possible', () => {
    // Hole: 7h 8h, Board: 6h 10h 2c — flush draw with straight flush potential
    // Adding 9h → 6h-7h-8h-9h-10h = straight flush
    // Adding Ah → Ah-10h-8h-7h-6h = ace-high flush
    const hole = [c('7', 'hearts'), c('8', 'hearts')];
    const community = [c('6', 'hearts'), c('10', 'hearts'), c('2', 'clubs')];
    const outs = findOuts(hole, community);

    const sf = outs.find(o => o.card.rank === '9' && o.card.suit === 'hearts');
    const flush = outs.find(o => o.card.rank === 'A' && o.card.suit === 'hearts');

    expect(sf).toBeDefined();
    expect(flush).toBeDefined();
    expect(sf!.newHandType).toBe(HandType.StraightFlush);
    expect(flush!.newHandType).toBe(HandType.Flush);
    expect(sf!.improvementDelta).toBeGreaterThan(flush!.improvementDelta);
    // 9h should be ranked above Ah
    expect(outs.indexOf(sf!)).toBeLessThan(outs.indexOf(flush!));
  });
});
