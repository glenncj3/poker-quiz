import type { QuizCategory } from '../types/quiz';
import { CategoryCard } from '../components/CategoryCard';
import { HandRankingsButton } from '../components/HandRankingsButton';

interface CategorySelectScreenProps {
  onSelect: (category: QuizCategory) => void;
  onBack: () => void;
  onOpenHandRankings: () => void;
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
    title: 'Endless Random',
    description: 'Answer questions until you miss. How long can you last?',
    icon: '🎲',
  },
];

export function CategorySelectScreen({ onSelect, onBack, onOpenHandRankings }: CategorySelectScreenProps) {
  return (
    <div className="h-dvh bg-dark-bg p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="bg-dark-card border border-gray-700 rounded-lg px-3 py-1 text-xs text-gray-300
              hover:border-gold hover:bg-dark-surface hover:text-gold active:scale-[0.97]
              transition-all duration-200 cursor-pointer"
          >
            ← Back
          </button>
          <HandRankingsButton onClick={onOpenHandRankings} />
        </div>

        <h2 className="text-xl font-bold text-gold mb-4 text-center">
          Choose a Category
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_INFO.slice(0, 4).map(info => (
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

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="col-start-1 col-end-3 mx-auto w-[calc(50%-0.25rem)]">
            <CategoryCard
              category={CATEGORY_INFO[4].category}
              title={CATEGORY_INFO[4].title}
              description={CATEGORY_INFO[4].description}
              icon={CATEGORY_INFO[4].icon}
              onClick={() => onSelect(CATEGORY_INFO[4].category)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
