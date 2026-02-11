import type { Card, Suit, Rank } from '../../types/card';
import type { Question, Option, Scenario } from '../../types/quiz';
import { SUITS, RANK_VALUES } from '../../types/card';
import { createDeck, drawCards, cardKey } from '../deck';
import { evaluateHand } from '../evaluator';
import { HandType } from '../../types/card';
import { shuffle } from '../../utils/shuffle';

type ActionArchetype = 'betValue' | 'betSemiBluff' | 'checkPotControl' | 'checkTrap';

interface ArchetypeTemplate {
  type: ActionArchetype;
  label: string;
  description: string;
  isCorrectFor: (handType: HandType, boardTexture: string, position: string) => boolean;
}

const ARCHETYPES: ArchetypeTemplate[] = [
  {
    type: 'betValue',
    label: 'Bet — for value',
    description: 'You have a strong hand and want to extract value from weaker hands.',
    isCorrectFor: (ht, board, pos) =>
      (ht >= HandType.TwoPair && board === 'dry' && pos === 'IP'),
  },
  {
    type: 'betSemiBluff',
    label: 'Bet — as a semi-bluff',
    description: 'You have a draw with equity and can win by making opponents fold or by completing your draw.',
    isCorrectFor: (ht, board) =>
      (ht <= HandType.Pair && board === 'wet'),
  },
  {
    type: 'checkPotControl',
    label: 'Check — to pot control',
    description: 'You have a medium-strength hand and want to keep the pot small.',
    isCorrectFor: (ht, board, pos) =>
      (ht >= HandType.Pair && ht <= HandType.TwoPair && board === 'dry' && pos === 'OOP'),
  },
  {
    type: 'checkTrap',
    label: 'Check — to trap',
    description: 'You have a monster hand and want to let opponents catch up or bluff.',
    isCorrectFor: (ht, board, pos) =>
      (ht >= HandType.FullHouse || (ht >= HandType.ThreeOfAKind && board === 'dry' && pos === 'OOP')),
  },
];

const POSITIONS = ['IP', 'OOP'] as const; // In Position, Out of Position
const BOARD_TEXTURES = ['dry', 'wet'] as const;

function classifyBoardTexture(community: Card[]): 'dry' | 'wet' {
  // Wet: flush draws or straight draws possible
  const suitCounts: Record<string, number> = {};
  for (const c of community) {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  }
  const maxSuitCount = Math.max(...Object.values(suitCounts));
  if (maxSuitCount >= 3) return 'wet';

  // Check for connected cards
  const values = community.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  let connected = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i - 1] <= 2) connected++;
  }
  return connected >= 2 ? 'wet' : 'dry';
}

/**
 * Generate a bet-or-check question.
 * Uses archetype-based approach: pick a correct action, then deal cards that match.
 */
export function generateBetOrCheckQuestion(): Question {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: community, remaining: r1 } = drawCards(deck, 5);
    const { drawn: holeCards } = drawCards(r1, 2);

    // Validate no duplicates
    const allCards = [...community, ...holeCards];
    const cardSet = new Set(allCards.map(cardKey));
    if (cardSet.size !== allCards.length) continue;

    const hand = evaluateHand(holeCards, community);
    const boardTexture = classifyBoardTexture(community);
    const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];

    // Find which archetype matches
    const matchingArchetypes = ARCHETYPES.filter(a =>
      a.isCorrectFor(hand.type, boardTexture, position)
    );

    if (matchingArchetypes.length === 0) continue;

    const correctArchetype = matchingArchetypes[0];
    const incorrectArchetypes = ARCHETYPES.filter(a => a.type !== correctArchetype.type);

    const options: Option[] = [
      {
        id: `opt_${correctArchetype.type}`,
        label: correctArchetype.label,
        isCorrect: true,
      },
      ...incorrectArchetypes.map(a => ({
        id: `opt_${a.type}`,
        label: a.label,
        isCorrect: false,
      })),
    ];

    const positionName = position === 'IP' ? 'in position' : 'out of position';
    const potSize = (Math.floor(Math.random() * 20) + 5) * 10;

    const scenario: Scenario = {
      communityCards: community,
      holeCards,
      position: positionName,
      potSize,
      street: 'River',
    };

    return {
      id: crypto.randomUUID(),
      category: 'betOrCheck',
      questionText: `You are ${positionName} on the river. What should you do?`,
      scenario,
      options: shuffle(options),
      explanation: `You have ${hand.name} on a ${boardTexture} board ${positionName}. ` +
        `${correctArchetype.description}`,
    };
  }

  throw new Error('Failed to generate bet/check question after max attempts');
}
