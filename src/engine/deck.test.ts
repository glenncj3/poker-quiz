import { describe, it, expect } from 'vitest';
import { cardKey, createDeck, drawCards, removeCards } from './deck';
import type { Card } from '../types/card';

function c(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

describe('cardKey', () => {
  it('returns rank_suit format', () => {
    expect(cardKey(c('A', 'spades'))).toBe('A_spades');
    expect(cardKey(c('10', 'hearts'))).toBe('10_hearts');
    expect(cardKey(c('2', 'clubs'))).toBe('2_clubs');
  });
});

describe('createDeck', () => {
  it('returns 52 cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
  });

  it('contains no duplicate cards', () => {
    const deck = createDeck();
    const keys = new Set(deck.map(cardKey));
    expect(keys.size).toBe(52);
  });

  it('contains all 4 suits for each rank', () => {
    const deck = createDeck();
    const aces = deck.filter(c => c.rank === 'A');
    expect(aces).toHaveLength(4);
    const suits = new Set(aces.map(c => c.suit));
    expect(suits).toEqual(new Set(['hearts', 'diamonds', 'clubs', 'spades']));
  });

  it('contains all 13 ranks for each suit', () => {
    const deck = createDeck();
    const spades = deck.filter(c => c.suit === 'spades');
    expect(spades).toHaveLength(13);
  });
});

describe('drawCards', () => {
  it('draws the correct number of cards', () => {
    const deck = createDeck();
    const { drawn, remaining } = drawCards(deck, 5);
    expect(drawn).toHaveLength(5);
    expect(remaining).toHaveLength(47);
  });

  it('drawn + remaining equals original deck', () => {
    const deck = createDeck();
    const { drawn, remaining } = drawCards(deck, 2);
    const combined = [...drawn, ...remaining];
    expect(combined).toHaveLength(52);
    expect(new Set(combined.map(cardKey))).toEqual(new Set(deck.map(cardKey)));
  });

  it('draws 0 cards correctly', () => {
    const deck = createDeck();
    const { drawn, remaining } = drawCards(deck, 0);
    expect(drawn).toHaveLength(0);
    expect(remaining).toHaveLength(52);
  });

  it('draws all cards correctly', () => {
    const deck = createDeck();
    const { drawn, remaining } = drawCards(deck, 52);
    expect(drawn).toHaveLength(52);
    expect(remaining).toHaveLength(0);
  });
});

describe('removeCards', () => {
  it('removes specified cards from the deck', () => {
    const deck = createDeck();
    const toRemove = [c('A', 'spades'), c('K', 'hearts')];
    const result = removeCards(deck, toRemove);
    expect(result).toHaveLength(50);
    const keys = new Set(result.map(cardKey));
    expect(keys.has('A_spades')).toBe(false);
    expect(keys.has('K_hearts')).toBe(false);
  });

  it('does not remove cards not in the removal list', () => {
    const deck = createDeck();
    const toRemove = [c('A', 'spades')];
    const result = removeCards(deck, toRemove);
    const keys = new Set(result.map(cardKey));
    expect(keys.has('A_hearts')).toBe(true);
    expect(keys.has('A_diamonds')).toBe(true);
    expect(keys.has('A_clubs')).toBe(true);
  });

  it('handles empty removal list', () => {
    const deck = createDeck();
    const result = removeCards(deck, []);
    expect(result).toHaveLength(52);
  });
});
