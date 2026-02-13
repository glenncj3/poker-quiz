import type { Card, Suit } from '../types/card';

export function suitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
  };
  return symbols[suit];
}

export function formatHoleCards(cards: Card[]): string {
  return cards.map(c => `${c.rank}${suitSymbol(c.suit)}`).join(' ');
}
