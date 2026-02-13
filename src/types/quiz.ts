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

export type Scenario =
  | { type: 'handRanking'; communityCards: Card[]; opponentHands: Card[][] }
  | { type: 'nutsReading'; communityCards: Card[]; street: string }
  | { type: 'outsImprovement'; communityCards: Card[]; holeCards: Card[]; street: string }
  | { type: 'preflopAction'; holeCards: Card[]; position: string; heroStack: number };

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
