import { Card } from '../components/Card';

interface HomeScreenProps {
  onStart: () => void;
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <div className="h-dvh bg-dark-bg flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="flex gap-2 mb-4 animate-scale-in">
        <Card card={{ rank: 'A', suit: 'spades' }} size="md" />
        <Card card={{ rank: 'K', suit: 'hearts' }} size="md" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gold mb-2 text-center">
        Poker Trainer
      </h1>

      <p className="text-gray-400 text-sm text-center mb-6 max-w-sm">
        Learn Texas Hold'em through interactive quizzes on hand strength, smart betting, and spotting helpful cards.
      </p>

      <button
        onClick={onStart}
        className="bg-gold text-dark-bg font-bold text-base px-8 py-3 rounded-xl
          hover:bg-gold-light active:scale-[0.97] transition-all duration-200 cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
      >
        Start Quiz
      </button>
    </div>
  );
}
