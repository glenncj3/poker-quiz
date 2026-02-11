import type { Question, QuizState } from '../types/quiz';
import { PokerTable } from '../components/PokerTable';
import { GameInfo } from '../components/GameInfo';
import { OptionButton } from '../components/OptionButton';
import { Explanation } from '../components/Explanation';
import { ProgressBar } from '../components/ProgressBar';

interface QuizScreenProps {
  state: QuizState;
  question: Question;
  onSelectAnswer: (optionId: string) => void;
  onNext: () => void;
  onQuit: () => void;
}

export function QuizScreen({ state, question, onSelectAnswer, onNext, onQuit }: QuizScreenProps) {
  const selectedId = state.answers[question.id];
  const selectedOption = question.options.find(o => o.id === selectedId);
  const isCorrect = selectedOption?.isCorrect ?? false;

  function getOptionState(optionId: string): 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled' {
    if (!state.showingExplanation) return 'default';
    const opt = question.options.find(o => o.id === optionId);
    if (opt?.isCorrect) return 'correct';
    if (optionId === selectedId) return 'incorrect';
    return 'disabled';
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 sm:p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onQuit}
            className="text-gray-400 hover:text-gold text-sm cursor-pointer transition-colors"
          >
            ← Quit
          </button>
        </div>

        <ProgressBar current={state.currentIndex} total={state.questions.length} />

        <PokerTable
          communityCards={question.scenario.communityCards}
          holeCards={question.scenario.holeCards}
          opponentHands={question.scenario.opponentHands}
        />

        <GameInfo
          potSize={question.scenario.potSize}
          betSize={question.scenario.betSize}
          position={question.scenario.position}
          street={question.scenario.street}
        />

        <p className="text-base font-semibold text-center text-gray-100">
          {question.questionText}
        </p>

        <div className="flex flex-col gap-2">
          {question.options.map(opt => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              state={getOptionState(opt.id)}
              onClick={() => onSelectAnswer(opt.id)}
              disabled={state.showingExplanation}
            />
          ))}
        </div>

        <Explanation
          isCorrect={isCorrect}
          text={question.explanation}
          visible={state.showingExplanation}
        />

        {state.showingExplanation && (
          <button
            onClick={onNext}
            className="bg-gold text-dark-bg font-bold py-3 rounded-xl
              hover:bg-gold-light active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            {state.currentIndex < state.questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}
