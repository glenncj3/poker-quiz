import type { QuizCategory } from '../types/quiz';
import { CategoryCard } from '../components/CategoryCard';

interface CategorySelectScreenProps {
  onSelect: (category: QuizCategory) => void;
  onBack: () => void;
}

const CATEGORY_INFO: { category: QuizCategory; title: string; description: string; icon: string }[] = [
  {
    category: 'handRanking',
    title: 'Hand Rankings',
    description: 'Compare poker hands and pick the winner.',
    icon: '👑',
  },
  {
    category: 'nutsReading',
    title: 'Best Hand',
    description: 'Figure out which cards make the strongest possible hand.',
    icon: '🔍',
  },
  {
    category: 'outsImprovement',
    title: 'Helping Cards',
    description: 'Spot the cards that could improve your hand.',
    icon: '🎯',
  },
  {
    category: 'preflopAction',
    title: 'Before the Flop',
    description: 'Decide whether to bet, call, or fold before community cards are dealt.',
    icon: '🃏',
  },
  {
    category: 'randomMix',
    title: 'Random Mix',
    description: 'Test all your skills with questions from every category.',
    icon: '🎲',
  },
];

export function CategorySelectScreen({ onSelect, onBack }: CategorySelectScreenProps) {
  return (
    <div className="h-dvh bg-dark-bg p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gold text-xs mb-3 cursor-pointer transition-colors"
        >
          ← Back
        </button>

        <h2 className="text-xl font-bold text-gold mb-4 text-center">
          Choose a Category
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_INFO.map(info => (
            <CategoryCard
              key={info.category}
              category={info.category}
              title={info.title}
              description={info.description}
              icon={info.icon}
              onClick={() => onSelect(info.category)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
