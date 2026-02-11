import type { Card } from '../types/card';
import { SUITS, RANKS } from '../types/card';
import { shuffle } from '../utils/shuffle';

export function cardKey(card: Card): string {
  return `${card.rank}_${card.suit}`;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffle(deck);
}

export function drawCards(deck: Card[], count: number): { drawn: Card[]; remaining: Card[] } {
  return {
    drawn: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

export function removeCards(deck: Card[], cardsToRemove: Card[]): Card[] {
  const removeSet = new Set(cardsToRemove.map(cardKey));
  return deck.filter(c => !removeSet.has(cardKey(c)));
}
