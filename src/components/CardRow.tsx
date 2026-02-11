import type { Card as CardType } from '../types/card';
import { Card } from './Card';

interface CardRowProps {
  cards: CardType[];
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
}

export function CardRow({ cards, label, size = 'md', faceDown = false }: CardRowProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      )}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {cards.map((card, i) => (
          <Card key={`${card.rank}_${card.suit}_${i}`} card={card} size={size} faceDown={faceDown} />
        ))}
      </div>
    </div>
  );
}
