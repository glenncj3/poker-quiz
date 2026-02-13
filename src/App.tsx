import { useState, useCallback, useEffect } from 'react';
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
  const { state, generationError, startQuiz, selectAnswer, nextQuestion, getCurrentQuestion, getResults } = useQuiz();

  const openHandRankings = useCallback(() => setHandRankingsOpen(true), []);
  const closeHandRankings = useCallback(() => setHandRankingsOpen(false), []);

  const handleSelectCategory = useCallback((category: QuizCategory) => {
    setLastCategory(category);
    startQuiz(category);
    setScreen('quiz');
  }, [startQuiz]);

  useEffect(() => {
    if (generationError && screen === 'quiz') {
      setScreen('categorySelect');
    }
  }, [generationError, screen]);

  useEffect(() => {
    if (state.completed && screen === 'quiz') {
      setScreen('results');
    }
  }, [state.completed, screen]);

  const handleNext = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

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
