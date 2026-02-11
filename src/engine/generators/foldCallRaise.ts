import type { Question, Option, Scenario } from '../../types/quiz';
import { HandType } from '../../types/card';
import { createDeck, drawCards, cardKey } from '../deck';
import { evaluateHand } from '../evaluator';
import { calculatePotOdds } from '../odds';
import { shuffle } from '../../utils/shuffle';

type ActionType = 'fold' | 'call' | 'raise';

interface ActionChoice {
  type: ActionType;
  label: string;
  qualifier: string;
}

const ACTIONS: ActionChoice[] = [
  { type: 'fold', label: 'Fold', qualifier: 'Your hand is too weak to continue' },
  { type: 'call', label: 'Call', qualifier: 'You have the right odds to see another card' },
  { type: 'raise', label: 'Raise', qualifier: 'You have a strong hand and want to build the pot' },
];

function getCorrectAction(handType: HandType, potOddsPercentage: number): ActionType {
  // Strong hands -> raise
  if (handType >= HandType.ThreeOfAKind) return 'raise';

  // Medium hands: depends on pot odds
  if (handType >= HandType.Pair) {
    // Good odds -> call, bad odds -> fold
    return potOddsPercentage <= 25 ? 'call' : 'fold';
  }

  // Two pair -> raise usually
  if (handType === HandType.TwoPair) return 'raise';

  // Weak hands: mostly fold unless very cheap
  if (potOddsPercentage <= 15) return 'call';
  return 'fold';
}

/**
 * Generate a fold/call/raise question.
 * Based on hand strength + pot odds -> correct action.
 */
export function generateFoldCallRaiseQuestion(): Question {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: community, remaining: r1 } = drawCards(deck, 5);
    const { drawn: holeCards } = drawCards(r1, 2);

    // Validate no duplicates
    const allCards = [...community, ...holeCards];
    const cardSet = new Set(allCards.map(cardKey));
    if (cardSet.size !== allCards.length) continue;

    const hand = evaluateHand(holeCards, community);

    // Generate realistic pot and bet sizes
    const potSize = (Math.floor(Math.random() * 30) + 5) * 10; // 50-350
    const betSize = Math.floor(potSize * (0.3 + Math.random() * 0.7)); // 30-100% of pot
    const odds = calculatePotOdds(potSize, betSize);

    const correctAction = getCorrectAction(hand.type, odds.percentage);

    // Build a 4th distractor action variant
    const allActions: ActionChoice[] = [
      { type: 'fold', label: 'Fold', qualifier: 'Your hand is too weak to continue' },
      { type: 'call', label: 'Call', qualifier: 'The pot odds justify continuing' },
      { type: 'raise', label: 'Raise', qualifier: 'Build the pot with your strong hand' },
      {
        type: correctAction === 'call' ? 'raise' : 'call',
        label: correctAction === 'call' ? 'Raise — as a bluff' : 'Call — to slow play',
        qualifier: correctAction === 'call'
          ? 'Apply pressure with a raise'
          : 'Disguise your hand strength',
      },
    ];

    // Deduplicate by type for the incorrect options
    const correctActionObj = allActions.find(a => a.type === correctAction)!;
    const incorrectActions = allActions
      .filter(a => a !== correctActionObj)
      .slice(0, 3);

    const options: Option[] = [
      {
        id: `opt_${correctAction}`,
        label: correctActionObj.label,
        isCorrect: true,
      },
      ...incorrectActions.map((a, i) => ({
        id: `opt_wrong_${i}`,
        label: a.label,
        isCorrect: false,
      })),
    ];

    const scenario: Scenario = {
      communityCards: community,
      holeCards,
      potSize,
      betSize,
      street: 'River',
    };

    return {
      id: crypto.randomUUID(),
      category: 'foldCallRaise',
      questionText: `The pot is $${potSize} and your opponent bets $${betSize}. What should you do?`,
      scenario,
      options: shuffle(options),
      explanation: `You have ${hand.name}. Pot odds are ${odds.ratio} (${odds.percentage}%). ` +
        `${correctActionObj.qualifier}.`,
    };
  }

  throw new Error('Failed to generate fold/call/raise question after max attempts');
}
