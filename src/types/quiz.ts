import type { Card } from './card';

export type QuizCategory =
  | 'handRanking'
  | 'nutsReading'
  | 'outsImprovement'
  | 'preflopAction'
  | 'randomMix';

export interface Option {
  id: string;
  label: string;
  cards?: Card[];
  isCorrect: boolean;
  disabled?: boolean;
}

export interface Scenario {
  communityCards: Card[];
  holeCards?: Card[];
  opponentHands?: Card[][];
  potSize?: number;
  betSize?: number;
  position?: string;
  street?: string;
  heroStack?: number;
  villainStack?: number;
}

export interface Question {
  id: string;
  category: QuizCategory;
  questionText: string;
  scenario: Scenario;
  options: Option[];
  explanation: string;
}

export interface GeneratorConfig {
  count: number;
}

export type QuestionGenerator = (config: GeneratorConfig) => Question[];

export interface QuizState {
  category: QuizCategory;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>; // questionId -> selectedOptionId
  showingExplanation: boolean;
  completed: boolean;
}
