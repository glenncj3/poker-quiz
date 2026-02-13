import { useState, useCallback } from 'react';
import type { QuizCategory, Question, QuizState, QuestionGenerator } from '../types/quiz';
import { generateHandRankingQuestion, generateHandRankingSet } from '../engine/generators/handRanking';
import { generateNutsReadingQuestion, generateNutsReadingSet } from '../engine/generators/nutsReading';
import { generateOutsImprovementQuestion, generateOutsImprovementSet } from '../engine/generators/outsImprovement';
import { generatePreflopActionQuestion, generatePreflopActionSet } from '../engine/generators/preflopAction';
import { shuffle } from '../utils/shuffle';

const DEFAULT_QUESTION_COUNT = 10;
const RANDOM_MIX_PER_CATEGORY = 2;

const SINGLE_GENERATORS: Record<Exclude<QuizCategory, 'randomMix'>, () => Question> = {
  handRanking: generateHandRankingQuestion,
  nutsReading: generateNutsReadingQuestion,
  outsImprovement: generateOutsImprovementQuestion,
  preflopAction: generatePreflopActionQuestion,
};

const SET_GENERATORS: Record<Exclude<QuizCategory, 'randomMix'>, QuestionGenerator> = {
  handRanking: generateHandRankingSet,
  nutsReading: generateNutsReadingSet,
  outsImprovement: generateOutsImprovementSet,
  preflopAction: generatePreflopActionSet,
};

const CATEGORIES: Exclude<QuizCategory, 'randomMix'>[] = [
  'handRanking', 'nutsReading', 'outsImprovement', 'preflopAction',
];

function generateQuestions(category: QuizCategory, count: number = DEFAULT_QUESTION_COUNT): Question[] {
  if (category === 'randomMix') {
    const questions: Question[] = [];
    for (const cat of CATEGORIES) {
      for (let i = 0; i < RANDOM_MIX_PER_CATEGORY; i++) {
        questions.push(SINGLE_GENERATORS[cat]());
      }
    }
    return shuffle(questions);
  }
  return SET_GENERATORS[category]({ count });
}

function generateOneRandom(): Question {
  const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  return SINGLE_GENERATORS[cat]();
}

export function useQuiz() {
  const [state, setState] = useState<QuizState>({
    category: 'randomMix',
    questions: [],
    currentIndex: 0,
    answers: {},
    showingExplanation: false,
    completed: false,
  });
  const [generationError, setGenerationError] = useState<string | null>(null);

  const startQuiz = useCallback((category: QuizCategory) => {
    setGenerationError(null);
    try {
      if (category === 'randomMix') {
        setState({
          category,
          questions: [generateOneRandom()],
          currentIndex: 0,
          answers: {},
          showingExplanation: false,
          completed: false,
        });
        return;
      }
      const questions = generateQuestions(category);
      setState({
        category,
        questions,
        currentIndex: 0,
        answers: {},
        showingExplanation: false,
        completed: false,
      });
    } catch {
      setGenerationError('Failed to generate questions. Please try again.');
    }
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
      if (prev.category === 'randomMix') {
        const currentQ = prev.questions[prev.currentIndex];
        const selectedId = currentQ ? prev.answers[currentQ.id] : undefined;
        const wasCorrect = currentQ?.options.find(o => o.id === selectedId)?.isCorrect ?? false;

        if (!wasCorrect) {
          return { ...prev, completed: true, showingExplanation: false };
        }
        // Correct: generate a new random question and advance
        try {
          const newQuestion = generateOneRandom();
          return {
            ...prev,
            questions: [...prev.questions, newQuestion],
            currentIndex: prev.currentIndex + 1,
            showingExplanation: false,
          };
        } catch {
          return { ...prev, completed: true, showingExplanation: false };
        }
      }

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
    generationError,
    startQuiz,
    selectAnswer,
    nextQuestion,
    getCurrentQuestion,
    getResults,
  };
}
