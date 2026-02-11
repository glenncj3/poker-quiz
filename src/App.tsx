import { useState, useCallback } from 'react';
import type { QuizCategory } from './types/quiz';
import { useQuiz } from './hooks/useQuiz';
import { HomeScreen } from './screens/HomeScreen';
import { CategorySelectScreen } from './screens/CategorySelectScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultsScreen } from './screens/ResultsScreen';

type Screen = 'home' | 'categorySelect' | 'quiz' | 'results';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [lastCategory, setLastCategory] = useState<QuizCategory>('randomMix');
  const { state, startQuiz, selectAnswer, nextQuestion, getCurrentQuestion, getResults } = useQuiz();

  const handleSelectCategory = useCallback((category: QuizCategory) => {
    setLastCategory(category);
    startQuiz(category);
    setScreen('quiz');
  }, [startQuiz]);

  const handleNext = useCallback(() => {
    if (state.currentIndex >= state.questions.length - 1) {
      nextQuestion();
      setScreen('results');
    } else {
      nextQuestion();
    }
  }, [nextQuestion, state.currentIndex, state.questions.length]);

  const handleRetry = useCallback(() => {
    startQuiz(lastCategory);
    setScreen('quiz');
  }, [startQuiz, lastCategory]);

  const question = getCurrentQuestion();

  switch (screen) {
    case 'home':
      return <HomeScreen onStart={() => setScreen('categorySelect')} />;

    case 'categorySelect':
      return (
        <CategorySelectScreen
          onSelect={handleSelectCategory}
          onBack={() => setScreen('home')}
        />
      );

    case 'quiz':
      if (!question) return null;
      return (
        <QuizScreen
          state={state}
          question={question}
          onSelectAnswer={selectAnswer}
          onNext={handleNext}
          onQuit={() => setScreen('categorySelect')}
        />
      );

    case 'results': {
      const results = getResults();
      return (
        <ResultsScreen
          correct={results.correct}
          total={results.total}
          details={results.details}
          onRetry={handleRetry}
          onCategorySelect={() => setScreen('categorySelect')}
          onHome={() => setScreen('home')}
        />
      );
    }
  }
}

export default App;
