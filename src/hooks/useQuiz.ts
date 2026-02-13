import { useState, useCallback } from 'react';
import type { QuizCategory, Question, QuizState } from '../types/quiz';
import { generateHandRankingQuestion } from '../engine/generators/handRanking';
import { generateNutsReadingQuestion } from '../engine/generators/nutsReading';
import { generateOutsImprovementQuestion } from '../engine/generators/outsImprovement';
import { generatePreflopActionQuestion } from '../engine/generators/preflopAction';
import { PreflopTier } from '../engine/preflop';
import { shuffle } from '../utils/shuffle';

const GENERATORS: Record<Exclude<QuizCategory, 'randomMix'>, () => Question> = {
  handRanking: generateHandRankingQuestion,
  nutsReading: generateNutsReadingQuestion,
  outsImprovement: generateOutsImprovementQuestion,
  preflopAction: generatePreflopActionQuestion,
};

const CATEGORIES: Exclude<QuizCategory, 'randomMix'>[] = [
  'handRanking', 'nutsReading', 'outsImprovement', 'preflopAction',
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
    return shuffle(questions);
  }

  if (category === 'nutsReading') {
    // 6 best hand, 2 second-best, 2 third-best
    const targetRanks = [1, 1, 1, 1, 1, 1, 2, 2, 3, 3];
    for (let i = 0; i < targetRanks.length; i++) {
      questions.push(generateNutsReadingQuestion({
        targetRank: targetRanks[i],
      }));
    }
    return shuffle(questions);
  }

  if (category === 'outsImprovement') {
    for (let i = 0; i < 6; i++) {
      questions.push(generateOutsImprovementQuestion('Flop'));
    }
    for (let i = 0; i < 4; i++) {
      questions.push(generateOutsImprovementQuestion('Turn'));
    }
    return shuffle(questions);
  }

  if (category === 'preflopAction') {
    // Tier frequency: 1×Trash, 2×Steal, 2×LPOpen, 2×MPOpen, 2×UTGOpen, 1×Strong
    const tierPattern: PreflopTier[] = [
      PreflopTier.Trash,
      PreflopTier.Steal, PreflopTier.Steal,
      PreflopTier.LPOpen, PreflopTier.LPOpen,
      PreflopTier.MPOpen, PreflopTier.MPOpen,
      PreflopTier.UTGOpen, PreflopTier.UTGOpen,
      PreflopTier.Strong,
    ];
    for (const tier of tierPattern) {
      questions.push(generatePreflopActionQuestion({ targetTier: tier }));
    }
    return shuffle(questions);
  }

  const generator = GENERATORS[category];
  for (let i = 0; i < count; i++) {
    questions.push(generator());
  }
  return questions;
}

function generateOneRandom(): Question {
  const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  return GENERATORS[cat]();
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

  const startQuiz = useCallback((category: QuizCategory) => {
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
        const newQuestion = generateOneRandom();
        return {
          ...prev,
          questions: [...prev.questions, newQuestion],
          currentIndex: prev.currentIndex + 1,
          showingExplanation: false,
        };
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
    startQuiz,
    selectAnswer,
    nextQuestion,
    getCurrentQuestion,
    getResults,
  };
}
