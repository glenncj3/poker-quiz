interface GameInfoProps {
  potSize?: number;
  betSize?: number;
  position?: string;
  street?: string;
}

export function GameInfo({ potSize, betSize, position, street }: GameInfoProps) {
  const items: { label: string; value: string }[] = [];

  if (street) items.push({ label: 'Street', value: street });
  if (position) items.push({ label: 'Position', value: position });
  if (potSize) items.push({ label: 'Pot', value: `$${potSize}` });
  if (betSize) items.push({ label: 'Bet', value: `$${betSize}` });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {items.map(item => (
        <div key={item.label} className="bg-dark-card rounded-lg px-3 py-1.5 text-sm">
          <span className="text-gray-400">{item.label}: </span>
          <span className="text-gold font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
