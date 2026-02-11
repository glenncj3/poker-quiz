import type { Card as CardType } from '../types/card';
import { CardRow } from './CardRow';

interface PokerTableProps {
  communityCards: CardType[];
  holeCards?: CardType[];
  opponentHands?: CardType[][];
}

export function PokerTable({ communityCards, holeCards, opponentHands }: PokerTableProps) {
  return (
    <div className="bg-felt rounded-2xl p-4 sm:p-6 shadow-lg border border-felt-dark relative">
      {/* Felt texture overlay */}
      <div className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />

      <div className="relative flex flex-col items-center gap-4">
        {/* Community cards */}
        <CardRow cards={communityCards} label="Community Cards" />

        {/* Opponent hands for hand ranking questions */}
        {opponentHands && opponentHands.length > 0 && (
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {opponentHands.map((hand, i) => (
              <CardRow
                key={i}
                cards={hand}
                label={`Player ${i + 1}`}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Player hole cards */}
        {holeCards && holeCards.length > 0 && !opponentHands && (
          <CardRow cards={holeCards} label="Your Hand" />
        )}
      </div>
    </div>
  );
}
