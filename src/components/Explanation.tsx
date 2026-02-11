interface ExplanationProps {
  isCorrect: boolean;
  text: string;
  visible: boolean;
}

export function Explanation({ isCorrect, text, visible }: ExplanationProps) {
  if (!visible) return null;

  return (
    <div className={`rounded-xl p-3 border-2 animate-slide-up
      ${isCorrect
        ? 'bg-correct/10 border-correct/30'
        : 'bg-incorrect/10 border-incorrect/30'
      }`}
    >
      <div className={`text-xs font-bold mb-1 ${isCorrect ? 'text-correct' : 'text-incorrect'}`}>
        {isCorrect ? 'Correct!' : 'Incorrect'}
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{text}</p>
    </div>
  );
}
