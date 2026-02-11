import type { QuizCategory } from '../types/quiz';

interface CategoryCardProps {
  category: QuizCategory;
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export function CategoryCard({ title, description, icon, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-dark-card border-2 border-gray-700 rounded-xl p-4 text-left
        hover:border-gold hover:bg-dark-surface active:scale-[0.98]
        transition-all duration-200 cursor-pointer group"
    >
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-100 mb-1">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </button>
  );
}
