interface GameInfoProps {
  potSize?: number;
  betSize?: number;
  position?: string;
  street?: string;
  heroStack?: number;
  villainStack?: number;
}

const POSITION_NAMES: Record<string, string> = {
  UTG: 'Early (UTG)',
  MP: 'Middle (MP)',
  CO: 'Cutoff (CO)',
  BTN: 'Dealer (BTN)',
  SB: 'Small Blind',
  BB: 'Big Blind',
};

export function GameInfo({ potSize, betSize, position, street, heroStack, villainStack }: GameInfoProps) {
  const items: { label: string; value: string }[] = [];

  if (street) items.push({ label: 'Round', value: street });
  if (position) items.push({ label: 'Position', value: POSITION_NAMES[position] || position });
  if (heroStack) items.push({ label: 'Your Chips', value: `$${heroStack}` });
  if (villainStack) items.push({ label: 'Opponent', value: `$${villainStack}` });
  if (potSize) items.push({ label: 'Pot', value: `$${potSize}` });
  if (betSize) items.push({ label: 'Bet', value: `$${betSize}` });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {items.map(item => (
        <div key={item.label} className="bg-dark-card rounded-lg px-2 py-1 text-xs">
          <span className="text-gray-400">{item.label}: </span>
          <span className="text-gold font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
