import type { Card } from '../../types/card';
import type { Question, Option, Scenario } from '../../types/quiz';
import { RANK_VALUES } from '../../types/card';
import { createDeck, drawCards, cardKey } from '../deck';
import { evaluateHand } from '../evaluator';
import { HandType } from '../../types/card';
import { shuffle } from '../../utils/shuffle';
import { classifyPreflopHand, handNotation, PreflopTier } from '../preflop';

type Street = 'Preflop' | 'Flop' | 'Turn' | 'River';
type ActionArchetype = 'betValue' | 'betSemiBluff' | 'checkPotControl' | 'checkTrap';

interface ArchetypeTemplate {
  type: ActionArchetype;
  label: string;
  preflopLabel: string;
  description: string;
}

const ARCHETYPES: ArchetypeTemplate[] = [
  {
    type: 'betValue',
    label: 'Bet — for value',
    preflopLabel: 'Raise — for value',
    description: 'You have a strong hand and want to extract value from weaker hands.',
  },
  {
    type: 'betSemiBluff',
    label: 'Bet — as a semi-bluff',
    preflopLabel: 'Raise — to steal',
    description: 'You have a draw with equity and can win by making opponents fold or by completing your draw.',
  },
  {
    type: 'checkPotControl',
    label: 'Check — to pot control',
    preflopLabel: 'Check — see a flop',
    description: 'You have a medium-strength hand and want to keep the pot small.',
  },
  {
    type: 'checkTrap',
    label: 'Check — to trap',
    preflopLabel: 'Check — to trap',
    description: 'You have a monster hand and want to let opponents catch up or bluff.',
  },
];

function isCorrectPostflop(
  type: ActionArchetype, ht: HandType, board: string, pos: string, street: Street,
): boolean {
  switch (type) {
    case 'betValue':
      return ht >= HandType.TwoPair && board === 'dry' && pos === 'IP';
    case 'betSemiBluff':
      return ht <= HandType.Pair && board === 'wet';
    case 'checkPotControl':
      return ht >= HandType.Pair && ht <= HandType.TwoPair && board === 'dry' && pos === 'OOP';
    case 'checkTrap':
      // On flop, trips is already a monster; on turn/river require full house+
      if (street === 'Flop') {
        return ht >= HandType.ThreeOfAKind || (ht >= HandType.ThreeOfAKind && board === 'dry' && pos === 'OOP');
      }
      return ht >= HandType.FullHouse || (ht >= HandType.ThreeOfAKind && board === 'dry' && pos === 'OOP');
    default:
      return false;
  }
}

function isCorrectPreflop(type: ActionArchetype, tier: PreflopTier, pos: string): boolean {
  switch (type) {
    case 'betValue':
      return tier >= PreflopTier.Premium || (tier >= PreflopTier.Strong && pos === 'IP');
    case 'betSemiBluff':
      return tier === PreflopTier.Marginal && pos === 'IP';
    case 'checkPotControl':
      return tier === PreflopTier.Playable && pos === 'OOP';
    case 'checkTrap':
      return tier >= PreflopTier.Premium && pos === 'OOP';
    default:
      return false;
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

function classifyBoardTexture(community: Card[]): 'dry' | 'wet' {
  if (community.length === 0) return 'dry';

  const suitCounts: Record<string, number> = {};
  for (const c of community) {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  }
  const maxSuitCount = Math.max(...Object.values(suitCounts));
  const suitThreshold = community.length <= 3 ? 2 : 3;
  if (maxSuitCount >= suitThreshold) return 'wet';

  const values = community.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  let connected = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i - 1] <= 2) connected++;
  }
  return connected >= 2 ? 'wet' : 'dry';
}

/**
 * Generate a bet-or-check question.
 * Supports preflop, flop, turn, and river streets.
 */
export function generateBetOrCheckQuestion(): Question {
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

    let matchingArchetype: ArchetypeTemplate | undefined;

    if (street === 'Preflop') {
      const tier = classifyPreflopHand(holeCards);
      matchingArchetype = ARCHETYPES.find(a => isCorrectPreflop(a.type, tier, position));
    } else {
      const hand = evaluateHand(holeCards, community);
      const boardTexture = classifyBoardTexture(community);
      matchingArchetype = ARCHETYPES.find(a =>
        isCorrectPostflop(a.type, hand.type, boardTexture, position, street),
      );
    }

    if (!matchingArchetype) continue;

    const correctArchetype = matchingArchetype;
    const incorrectArchetypes = ARCHETYPES.filter(a => a.type !== correctArchetype.type);

    const labelFor = (a: ArchetypeTemplate) => street === 'Preflop' ? a.preflopLabel : a.label;

    const options: Option[] = [
      {
        id: `opt_${correctArchetype.type}`,
        label: labelFor(correctArchetype),
        isCorrect: true,
      },
      ...incorrectArchetypes.map(a => ({
        id: `opt_${a.type}`,
        label: labelFor(a),
        isCorrect: false,
      })),
    ];

    const positionName = position === 'IP' ? 'in position' : 'out of position';
    const potSize = (Math.floor(Math.random() * 20) + 5) * 10;

    const streetPhrase = street === 'Preflop' ? 'preflop' : `on the ${street.toLowerCase()}`;

    const scenario: Scenario = {
      communityCards: community,
      holeCards,
      position: positionName,
      potSize,
      street,
    };

    const handDescription = street === 'Preflop'
      ? handNotation(holeCards)
      : evaluateHand(holeCards, community).name;

    const boardDescription = street === 'Preflop'
      ? ''
      : ` on a ${classifyBoardTexture(community)} board`;

    return {
      id: crypto.randomUUID(),
      category: 'betOrCheck',
      questionText: `You are ${positionName} ${streetPhrase}. What should you do?`,
      scenario,
      options: shuffle(options),
      explanation: `You have ${handDescription}${boardDescription} ${positionName}. ` +
        `${correctArchetype.description}`,
    };
  }

  throw new Error('Failed to generate bet/check question after max attempts');
}
