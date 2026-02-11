import { useState, useCallback } from 'react';
import type { QuizCategory } from './types/quiz';
import { useQuiz } from './hooks/useQuiz';
import { HomeScreen } from './screens/HomeScreen';
import { CategorySelectScreen } from './screens/CategorySelectScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { HandRankingsModal } from './components/HandRankingsModal';

type Screen = 'home' | 'categorySelect' | 'quiz' | 'results';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [lastCategory, setLastCategory] = useState<QuizCategory>('randomMix');
  const [handRankingsOpen, setHandRankingsOpen] = useState(false);
  const { state, startQuiz, selectAnswer, nextQuestion, getCurrentQuestion, getResults } = useQuiz();

  const openHandRankings = useCallback(() => setHandRankingsOpen(true), []);
  const closeHandRankings = useCallback(() => setHandRankingsOpen(false), []);

  const handleSelectCategory = useCallback((category: QuizCategory) => {
    setLastCategory(category);
    startQuiz(category);
    setScreen('quiz');
  }, [startQuiz]);

  const handleNext = useCallback(() => {
    if (lastCategory === 'randomMix') {
      const currentQ = state.questions[state.currentIndex];
      const selectedId = currentQ ? state.answers[currentQ.id] : undefined;
      const wasCorrect = currentQ?.options.find(o => o.id === selectedId)?.isCorrect ?? false;
      nextQuestion();
      if (!wasCorrect) {
        setScreen('results');
      }
      return;
    }

    if (state.currentIndex >= state.questions.length - 1) {
      nextQuestion();
      setScreen('results');
    } else {
      nextQuestion();
    }
  }, [nextQuestion, state.currentIndex, state.questions, state.answers, lastCategory]);

  const handleRetry = useCallback(() => {
    startQuiz(lastCategory);
    setScreen('quiz');
  }, [startQuiz, lastCategory]);

  const question = getCurrentQuestion();

  const modal = <HandRankingsModal open={handRankingsOpen} onClose={closeHandRankings} />;

  switch (screen) {
    case 'home':
      return <HomeScreen onStart={() => setScreen('categorySelect')} />;

    case 'categorySelect':
      return (
        <>
          <CategorySelectScreen
            onSelect={handleSelectCategory}
            onBack={() => setScreen('home')}
            onOpenHandRankings={openHandRankings}
          />
          {modal}
        </>
      );

    case 'quiz':
      if (!question) return null;
      return (
        <>
          <QuizScreen
            state={state}
            question={question}
            isStreak={lastCategory === 'randomMix'}
            onSelectAnswer={selectAnswer}
            onNext={handleNext}
            onQuit={() => setScreen('categorySelect')}
            onOpenHandRankings={openHandRankings}
          />
          {modal}
        </>
      );

    case 'results': {
      const results = getResults();
      return (
        <>
          <ResultsScreen
            correct={results.correct}
            total={results.total}
            details={results.details}
            isStreak={lastCategory === 'randomMix'}
            onRetry={handleRetry}
            onCategorySelect={() => setScreen('categorySelect')}
            onHome={() => setScreen('home')}
            onOpenHandRankings={openHandRankings}
          />
          {modal}
        </>
      );
    }
  }
}

export default App;
