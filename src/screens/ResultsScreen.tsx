import { useState } from 'react';
import { ScoreRing } from '../components/ScoreRing';
import { HandRankingsButton } from '../components/HandRankingsButton';
import type { Question, Option } from '../types/quiz';

interface ResultDetail {
  question: Question;
  selectedOption: Option | undefined;
  correctOption: Option | undefined;
  isCorrect: boolean;
}

interface ResultsScreenProps {
  correct: number;
  total: number;
  details: ResultDetail[];
  onRetry: () => void;
  onCategorySelect: () => void;
  onHome: () => void;
  onOpenHandRankings: () => void;
}

export function ResultsScreen({ correct, total, details, onRetry, onCategorySelect, onHome, onOpenHandRankings }: ResultsScreenProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  let message = 'Keep practicing!';
  if (pct >= 90) message = 'Outstanding!';
  else if (pct >= 70) message = 'Great job!';
  else if (pct >= 50) message = 'Not bad!';

  return (
    <div className="h-dvh bg-dark-bg p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="max-w-lg mx-auto flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onCategorySelect}
            className="bg-dark-card border border-gray-700 rounded-lg px-3 py-1 text-xs text-gray-300
              hover:border-gold hover:bg-dark-surface hover:text-gold active:scale-[0.97]
              transition-all duration-200 cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Go to categories"
          >
            ← Categories
          </button>
          <h2 className="text-xl font-bold text-gold">Quiz Complete</h2>
          <HandRankingsButton onClick={onOpenHandRankings} />
        </div>

        <ScoreRing correct={correct} total={total} size={120} />

        <p className="text-base text-gray-300">{message} — {pct}%</p>

        {/* Review List */}
        <div className="w-full flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Review</h3>
          {details.map((d, i) => (
            <button
              key={i}
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer
                ${d.isCorrect
                  ? 'border-correct/30 bg-correct/5'
                  : 'border-incorrect/30 bg-incorrect/5'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${d.isCorrect ? 'text-correct' : 'text-incorrect'}`}>
                  {d.isCorrect ? '✓' : '✗'}
                </span>
                <span className="text-sm text-gray-200 flex-1">
                  Q{i + 1}: {d.question.questionText}
                </span>
                <span className="text-xs text-gray-500">
                  {expandedIndex === i ? '▲' : '▼'}
                </span>
              </div>

              {expandedIndex === i && (
                <div className="mt-2 pt-2 border-t border-gray-700 text-xs space-y-1">
                  <p className="text-gray-400">
                    Your answer: <span className={d.isCorrect ? 'text-correct' : 'text-incorrect'}>
                      {d.selectedOption?.label || 'None'}
                    </span>
                  </p>
                  {!d.isCorrect && (
                    <p className="text-gray-400">
                      Correct answer: <span className="text-correct">{d.correctOption?.label || 'Unknown'}</span>
                    </p>
                  )}
                  <p className="text-gray-500 mt-1">{d.question.explanation}</p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={onRetry}
            className="w-full bg-gold text-dark-bg font-bold py-2.5 rounded-xl
              hover:bg-gold-light active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            Try Again
          </button>
          <button
            onClick={onCategorySelect}
            className="w-full bg-dark-card border-2 border-gray-600 text-gray-200 font-semibold py-2.5 rounded-xl
              hover:border-gold hover:text-gold active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            Change Category
          </button>
          <button
            onClick={onHome}
            className="w-full text-gray-400 hover:text-gold py-2 text-sm cursor-pointer transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
