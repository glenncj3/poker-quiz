import type { Question, Option, Scenario } from '../../types/quiz';
import { HandType } from '../../types/card';
import { createDeck, drawCards, cardKey } from '../deck';
import { evaluateHand } from '../evaluator';
import { calculatePotOdds } from '../odds';
import { shuffle } from '../../utils/shuffle';
import { classifyPreflopHand, handNotation, PreflopTier } from '../preflop';

type Street = 'Preflop' | 'Flop' | 'Turn' | 'River';
type ActionType = 'fold' | 'call' | 'raise';

interface ActionChoice {
  type: ActionType;
  label: string;
  qualifier: string;
}

function getCorrectAction(handType: HandType, potOddsPercentage: number): ActionType {
  // Strong hands -> raise
  if (handType >= HandType.ThreeOfAKind) return 'raise';

  // Two pair -> raise (must come before Pair check)
  if (handType === HandType.TwoPair) return 'raise';

  // Medium hands: depends on pot odds
  if (handType >= HandType.Pair) {
    return potOddsPercentage <= 25 ? 'call' : 'fold';
  }

  // Weak hands: mostly fold unless very cheap
  if (potOddsPercentage <= 15) return 'call';
  return 'fold';
}

function getCorrectActionPreflop(tier: PreflopTier, potOddsPercentage: number, position: string): ActionType {
  switch (tier) {
    case PreflopTier.Premium:
      return 'raise';
    case PreflopTier.Strong:
      return position === 'IP' ? 'raise' : 'call';
    case PreflopTier.Playable:
      return potOddsPercentage <= 25 ? 'call' : 'fold';
    case PreflopTier.Marginal:
      return potOddsPercentage <= 15 && position === 'IP' ? 'call' : 'fold';
    default:
      return 'fold';
  }
}

const POSITIONS = ['IP', 'OOP'] as const;

function pickStreet(): Street {
  const roll = Math.random() * 100;
  if (roll < 30) return 'Preflop';
  if (roll < 60) return 'Flop';
  if (roll < 80) return 'Turn';
  return 'River';
}

function communityCardCount(street: Street): number {
  switch (street) {
    case 'Preflop': return 0;
    case 'Flop': return 3;
    case 'Turn': return 4;
    case 'River': return 5;
  }
}

/**
 * Generate a fold/call/raise question.
 * Supports preflop, flop, turn, and river streets.
 */
export function generateFoldCallRaiseQuestion(): Question {
  const maxAttempts = 100;
  const street = pickStreet();
  const ccCount = communityCardCount(street);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: community, remaining: r1 } = drawCards(deck, ccCount);
    const { drawn: holeCards } = drawCards(r1, 2);

    const allCards = [...community, ...holeCards];
    const cardSet = new Set(allCards.map(cardKey));
    if (cardSet.size !== allCards.length) continue;

    const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    const positionName = position === 'IP' ? 'in position' : 'out of position';

    let potSize: number;
    let betSize: number;
    let correctAction: ActionType;
    let handLabel: string;

    if (street === 'Preflop') {
      potSize = (Math.floor(Math.random() * 10) + 3) * 5; // $15-$65
      betSize = Math.floor(potSize * (0.4 + Math.random() * 0.6)); // 40-100% of pot
      if (betSize < 6) betSize = 6;
      const tier = classifyPreflopHand(holeCards);
      const odds = calculatePotOdds(potSize, betSize);
      correctAction = getCorrectActionPreflop(tier, odds.percentage, position);
      handLabel = handNotation(holeCards);
    } else {
      potSize = (Math.floor(Math.random() * 30) + 5) * 10; // $50-$350
      betSize = Math.floor(potSize * (0.3 + Math.random() * 0.7)); // 30-100% of pot
      const hand = evaluateHand(holeCards, community);
      const odds = calculatePotOdds(potSize, betSize);
      correctAction = getCorrectAction(hand.type, odds.percentage);
      handLabel = hand.name;
    }

    const odds = calculatePotOdds(potSize, betSize);

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
      position: positionName,
      street,
    };

    const streetPhrase = street === 'Preflop' ? 'preflop' : `on the ${street.toLowerCase()}`;
    const questionText = street === 'Preflop'
      ? `You hold ${handLabel} ${positionName}. The pot is $${potSize} and your opponent raises to $${betSize}. What should you do?`
      : `The pot is $${potSize} and your opponent bets $${betSize} ${streetPhrase}. What should you do?`;

    return {
      id: crypto.randomUUID(),
      category: 'foldCallRaise',
      questionText,
      scenario,
      options: shuffle(options),
      explanation: `You have ${handLabel}. Pot odds are ${odds.ratio} (${odds.percentage}%). ` +
        `${correctActionObj.qualifier}.`,
    };
  }

  throw new Error('Failed to generate fold/call/raise question after max attempts');
}
