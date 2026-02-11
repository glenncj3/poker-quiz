import { useState, useCallback } from 'react';
import type { QuizCategory, Question, QuizState } from '../types/quiz';
import { generateHandRankingQuestion } from '../engine/generators/handRanking';
import { generateNutsReadingQuestion } from '../engine/generators/nutsReading';
import { generateOutsImprovementQuestion } from '../engine/generators/outsImprovement';
import { generateBetOrCheckQuestion } from '../engine/generators/betOrCheck';
import { generateFoldCallRaiseQuestion } from '../engine/generators/foldCallRaise';

const GENERATORS: Record<Exclude<QuizCategory, 'randomMix'>, () => Question> = {
  handRanking: generateHandRankingQuestion,
  nutsReading: generateNutsReadingQuestion,
  outsImprovement: generateOutsImprovementQuestion,
  betOrCheck: generateBetOrCheckQuestion,
  foldCallRaise: generateFoldCallRaiseQuestion,
};

const CATEGORIES: Exclude<QuizCategory, 'randomMix'>[] = [
  'handRanking', 'nutsReading', 'outsImprovement', 'betOrCheck', 'foldCallRaise',
];

function generateQuestions(category: QuizCategory, count: number = 10): Question[] {
  const questions: Question[] = [];

  if (category === 'randomMix') {
    // 2 questions per category
    for (const cat of CATEGORIES) {
      for (let i = 0; i < 2; i++) {
        questions.push(GENERATORS[cat]());
      }
    }
    // Shuffle the mix
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  }

  const generator = GENERATORS[category];
  for (let i = 0; i < count; i++) {
    questions.push(generator());
  }
  return questions;
}

export function useQuiz() {
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    answers: {},
    showingExplanation: false,
    completed: false,
  });

  const startQuiz = useCallback((category: QuizCategory) => {
    const questions = generateQuestions(category);
    setState({
      questions,
      currentIndex: 0,
      answers: {},
      showingExplanation: false,
      completed: false,
    });
  }, []);

  const selectAnswer = useCallback((optionId: string) => {
    setState(prev => {
      if (prev.showingExplanation) return prev;
      const question = prev.questions[prev.currentIndex];
      if (!question) return prev;
      return {
        ...prev,
        answers: { ...prev.answers, [question.id]: optionId },
        showingExplanation: true,
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return { ...prev, completed: true, showingExplanation: false };
      }
      return { ...prev, currentIndex: nextIndex, showingExplanation: false };
    });
  }, []);

  const getCurrentQuestion = useCallback((): Question | null => {
    return state.questions[state.currentIndex] || null;
  }, [state.questions, state.currentIndex]);

  const getResults = useCallback(() => {
    let correct = 0;
    const details = state.questions.map(q => {
      const selectedId = state.answers[q.id];
      const selectedOption = q.options.find(o => o.id === selectedId);
      const correctOption = q.options.find(o => o.isCorrect);
      const isCorrect = selectedOption?.isCorrect ?? false;
      if (isCorrect) correct++;
      return {
        question: q,
        selectedOption,
        correctOption,
        isCorrect,
      };
    });
    return { correct, total: state.questions.length, details };
  }, [state.questions, state.answers]);

  return {
    state,
    startQuiz,
    selectAnswer,
    nextQuestion,
    getCurrentQuestion,
    getResults,
  };
}
