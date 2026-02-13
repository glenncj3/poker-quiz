import type { Question, QuizState, Scenario } from '../types/quiz';
import type { Card } from '../types/card';
import { PokerTable } from '../components/PokerTable';
import { GameInfo } from '../components/GameInfo';
import { OptionButton } from '../components/OptionButton';
import { Explanation } from '../components/Explanation';
import { ProgressBar } from '../components/ProgressBar';
import { HandRankingsButton } from '../components/HandRankingsButton';
import { NavButton } from '../components/NavButton';

function getPokerTableProps(scenario: Scenario) {
  switch (scenario.type) {
    case 'handRanking':
      return { communityCards: scenario.communityCards, opponentHands: scenario.opponentHands };
    case 'nutsReading':
      return { communityCards: scenario.communityCards };
    case 'outsImprovement':
      return { communityCards: scenario.communityCards, holeCards: scenario.holeCards };
    case 'preflopAction':
      return { communityCards: [] as Card[], holeCards: scenario.holeCards };
  }
}

function getGameInfoProps(scenario: Scenario) {
  switch (scenario.type) {
    case 'nutsReading':
      return { street: scenario.street };
    case 'outsImprovement':
      return { street: scenario.street };
    case 'preflopAction':
      return { position: scenario.position, street: 'Preflop', heroStack: scenario.heroStack };
    default:
      return {};
  }
}

interface QuizScreenProps {
  state: QuizState;
  question: Question;
  isStreak?: boolean;
  onSelectAnswer: (optionId: string) => void;
  onNext: () => void;
  onQuit: () => void;
  onOpenHandRankings: () => void;
}

export function QuizScreen({ state, question, isStreak, onSelectAnswer, onNext, onQuit, onOpenHandRankings }: QuizScreenProps) {
  const selectedId = state.answers[question.id];
  const selectedOption = question.options.find(o => o.id === selectedId);
  const isCorrect = selectedOption?.isCorrect ?? false;

  function getOptionState(optionId: string): 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled' {
    const opt = question.options.find(o => o.id === optionId);
    if (opt?.disabled) return 'disabled';
    if (!state.showingExplanation) return 'default';
    if (opt?.isCorrect) return 'correct';
    if (optionId === selectedId) return 'incorrect';
    return 'disabled';
  }

  return (
    <div className="h-dvh bg-dark-bg p-3 animate-fade-in overflow-y-auto">
      <div className="max-w-lg mx-auto flex flex-col gap-2 min-h-full">
        <div className="flex items-center justify-between">
          <NavButton label="← Quit" onClick={onQuit} ariaLabel="Quit quiz" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {isStreak
                ? `Streak: ${state.currentIndex}`
                : `${state.currentIndex + 1}/${state.questions.length}`}
            </span>
            <HandRankingsButton onClick={onOpenHandRankings} />
          </div>
        </div>

        {!isStreak && <ProgressBar current={state.currentIndex} total={state.questions.length} />}

        {/* Key forces re-mount + animation on question change */}
        <div key={question.id} className="flex flex-col gap-2 animate-scale-in flex-1">
          <PokerTable {...getPokerTableProps(question.scenario)} />

          <GameInfo {...getGameInfoProps(question.scenario)} />

          <p className="text-sm font-semibold text-center text-gray-100">
            {question.questionText}
          </p>

          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Answer options">
            {question.options.map(opt => (
              <OptionButton
                key={opt.id}
                label={opt.label}
                state={getOptionState(opt.id)}
                onClick={() => onSelectAnswer(opt.id)}
                disabled={state.showingExplanation || !!opt.disabled}
              />
            ))}
          </div>
        </div>

        <div className="shrink-0 mt-auto flex flex-col gap-2">
          {state.showingExplanation ? (
            <>
              <Explanation
                isCorrect={isCorrect}
                text={question.explanation}
                visible={state.showingExplanation}
              />

              <button
                onClick={onNext}
                className="bg-gold text-dark-bg font-bold py-2.5 rounded-xl animate-slide-up shrink-0
                  hover:bg-gold-light active:scale-[0.97] transition-all duration-200 cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
              >
                {isStreak
                  ? (isCorrect ? 'Next Question' : 'Game Over — See Results')
                  : (state.currentIndex < state.questions.length - 1 ? 'Next Question' : 'See Results')}
              </button>
            </>
          ) : (
            <div className="min-h-[120px]" />
          )}
        </div>
      </div>
    </div>
  );
}
