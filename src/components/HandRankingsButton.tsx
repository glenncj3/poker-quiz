interface HandRankingsButtonProps {
  onClick: () => void;
}

export function HandRankingsButton({ onClick }: HandRankingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="text-gray-400 hover:text-gold text-xs cursor-pointer transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      Hand Rankings
    </button>
  );
}
