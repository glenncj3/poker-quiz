interface HandRankingsButtonProps {
  onClick: () => void;
}

export function HandRankingsButton({ onClick }: HandRankingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-dark-card border border-gray-700 rounded-lg px-3 py-1 text-xs text-gray-300
        hover:border-gold hover:bg-dark-surface hover:text-gold active:scale-[0.97]
        transition-all duration-200 cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      Hand Rankings
    </button>
  );
}
