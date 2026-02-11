interface OptionButtonProps {
  label: string;
  state: 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled';
  onClick: () => void;
  disabled?: boolean;
}

const STATE_CLASSES: Record<string, string> = {
  default: 'bg-dark-card border-gray-600 hover:border-gold hover:bg-dark-surface active:scale-[0.98]',
  selected: 'bg-dark-surface border-gold text-gold',
  correct: 'bg-correct/20 border-correct text-correct animate-pulse-correct',
  incorrect: 'bg-incorrect/20 border-incorrect text-incorrect animate-pulse-incorrect',
  disabled: 'bg-dark-card border-gray-700 text-gray-500 cursor-not-allowed',
};

export function OptionButton({ label, state, onClick, disabled }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || state === 'disabled'}
      className={`w-full min-h-[40px] px-3 py-2 rounded-xl border-2 text-left text-sm
        font-medium transition-all duration-200 cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg
        ${STATE_CLASSES[state]}`}
      aria-label={label}
    >
      {label}
    </button>
  );
}
