import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from './Card';
import type { Card as CardType } from '../types/card';

interface HandRankingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface HandExample {
  name: string;
  cards: CardType[];
}

const HAND_EXAMPLES: HandExample[] = [
  {
    name: 'Royal Flush',
    cards: [
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'spades' },
      { rank: 'Q', suit: 'spades' },
      { rank: 'J', suit: 'spades' },
      { rank: '10', suit: 'spades' },
    ],
  },
  {
    name: 'Straight Flush',
    cards: [
      { rank: '9', suit: 'hearts' },
      { rank: '8', suit: 'hearts' },
      { rank: '7', suit: 'hearts' },
      { rank: '6', suit: 'hearts' },
      { rank: '5', suit: 'hearts' },
    ],
  },
  {
    name: 'Four of a Kind',
    cards: [
      { rank: 'K', suit: 'clubs' },
      { rank: 'K', suit: 'diamonds' },
      { rank: 'K', suit: 'hearts' },
      { rank: 'K', suit: 'spades' },
      { rank: '7', suit: 'diamonds' },
    ],
  },
  {
    name: 'Full House',
    cards: [
      { rank: 'J', suit: 'spades' },
      { rank: 'J', suit: 'hearts' },
      { rank: 'J', suit: 'diamonds' },
      { rank: '8', suit: 'clubs' },
      { rank: '8', suit: 'spades' },
    ],
  },
  {
    name: 'Flush',
    cards: [
      { rank: 'A', suit: 'diamonds' },
      { rank: 'J', suit: 'diamonds' },
      { rank: '8', suit: 'diamonds' },
      { rank: '6', suit: 'diamonds' },
      { rank: '3', suit: 'diamonds' },
    ],
  },
  {
    name: 'Straight',
    cards: [
      { rank: '10', suit: 'spades' },
      { rank: '9', suit: 'diamonds' },
      { rank: '8', suit: 'clubs' },
      { rank: '7', suit: 'hearts' },
      { rank: '6', suit: 'spades' },
    ],
  },
  {
    name: 'Three of a Kind',
    cards: [
      { rank: 'Q', suit: 'hearts' },
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'diamonds' },
      { rank: '9', suit: 'clubs' },
      { rank: '4', suit: 'spades' },
    ],
  },
  {
    name: 'Two Pair',
    cards: [
      { rank: '10', suit: 'hearts' },
      { rank: '10', suit: 'clubs' },
      { rank: '5', suit: 'spades' },
      { rank: '5', suit: 'diamonds' },
      { rank: 'K', suit: 'hearts' },
    ],
  },
  {
    name: 'Pair',
    cards: [
      { rank: '8', suit: 'spades' },
      { rank: '8', suit: 'diamonds' },
      { rank: 'A', suit: 'clubs' },
      { rank: 'J', suit: 'hearts' },
      { rank: '4', suit: 'diamonds' },
    ],
  },
  {
    name: 'High Card',
    cards: [
      { rank: 'A', suit: 'hearts' },
      { rank: 'J', suit: 'spades' },
      { rank: '8', suit: 'clubs' },
      { rank: '5', suit: 'diamonds' },
      { rank: '2', suit: 'spades' },
    ],
  },
];

export function HandRankingsModal({ open, onClose }: HandRankingsModalProps) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[85dvh] overflow-y-auto
          bg-dark-surface rounded-xl p-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gold">Hand Rankings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg cursor-pointer transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Hand list */}
        <div className="flex flex-col gap-3">
          {HAND_EXAMPLES.map((hand, i) => (
            <div key={hand.name}>
              <p className="text-sm text-gray-300 mb-1">{hand.name}</p>
              <div className="flex gap-1">
                {hand.cards.map((card, j) => (
                  <Card key={j} card={card} size="xs" />
                ))}
              </div>
              {i < HAND_EXAMPLES.length - 1 && (
                <div className="border-b border-gray-700/50 mt-3" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
