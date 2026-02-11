import type { Card } from './card';

export type QuizCategory =
  | 'handRanking'
  | 'nutsReading'
  | 'outsImprovement'
  | 'betOrCheck'
  | 'foldCallRaise'
  | 'randomMix';

export interface Option {
  id: string;
  label: string;
  cards?: Card[];
  isCorrect: boolean;
}

export interface Scenario {
  communityCards: Card[];
  holeCards?: Card[];
  opponentHands?: Card[][];
  potSize?: number;
  betSize?: number;
  position?: string;
  street?: string;
}

export interface Question {
  id: string;
  category: QuizCategory;
  questionText: string;
  scenario: Scenario;
  options: Option[];
  explanation: string;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>; // questionId -> selectedOptionId
  showingExplanation: boolean;
  completed: boolean;
}
