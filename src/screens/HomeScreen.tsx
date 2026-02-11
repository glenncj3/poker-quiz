import { Card } from '../components/Card';

interface HomeScreenProps {
  onStart: () => void;
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6">
      <div className="flex gap-2 mb-6">
        <Card card={{ rank: 'A', suit: 'spades' }} size="lg" />
        <Card card={{ rank: 'K', suit: 'hearts' }} size="lg" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-bold text-gold mb-3 text-center">
        Poker Trainer
      </h1>

      <p className="text-gray-400 text-center mb-8 max-w-sm">
        Sharpen your Texas Hold'em skills with interactive quizzes on hand reading, outs, and strategy.
      </p>

      <button
        onClick={onStart}
        className="bg-gold text-dark-bg font-bold text-lg px-8 py-4 rounded-xl
          hover:bg-gold-light active:scale-[0.97] transition-all duration-200 cursor-pointer"
      >
        Start Quiz
      </button>
    </div>
  );
}
