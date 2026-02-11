import type { Card, Suit, Rank } from '../../types/card';
import type { Question, Option, Scenario } from '../../types/quiz';
import { SUITS, RANKS, RANK_VALUES, HandType } from '../../types/card';
import { cardKey } from '../deck';
import { findOuts } from '../outs';
import { shuffle } from '../../utils/shuffle';

type DrawType = 'flushDraw' | 'oesd' | 'gutshot';

interface DrawSetup {
  holeCards: Card[];
  communityCards: Card[];
  drawType: DrawType;
}

function randomSuit(): Suit {
  return SUITS[Math.floor(Math.random() * SUITS.length)];
}

function randomRank(min = 2, max = 14): Rank {
  const val = min + Math.floor(Math.random() * (max - min + 1));
  const entry = Object.entries(RANK_VALUES).find(([, v]) => v === val);
  return (entry?.[0] || '7') as Rank;
}

function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

/**
 * Construct a draw scenario intentionally.
 * street controls whether to deal 3 (Flop) or 4 (Turn) community cards.
 */
function constructDrawScenario(street: 'Flop' | 'Turn'): DrawSetup {
  const drawTypes: DrawType[] = ['flushDraw', 'oesd', 'gutshot'];
  const drawType = drawTypes[Math.floor(Math.random() * drawTypes.length)];

  let holeCards: Card[];
  let communityCards: Card[];

  if (drawType === 'flushDraw') {
    // 4 cards of same suit, need 1 more
    const suit = randomSuit();
    const otherSuit = SUITS.find(s => s !== suit)!;
    const ranks = shuffle([...RANKS]).slice(0, 7);
    holeCards = [makeCard(ranks[0], suit), makeCard(ranks[1], suit)];
    communityCards = [
      makeCard(ranks[2], suit),
      makeCard(ranks[3], suit),
      makeCard(ranks[4], otherSuit),
    ];
    if (street === 'Turn') {
      // Add a 4th community card in a different suit to keep the flush draw alive
      const offSuits = SUITS.filter(s => s !== suit);
      communityCards.push(makeCard(ranks[5], offSuits[Math.floor(Math.random() * offSuits.length)]));
    }
  } else if (drawType === 'oesd') {
    // Open-ended straight draw: 4 consecutive cards
    const suited = Math.random() < 0.5;
    const startVal = suited
      ? 4 + Math.floor(Math.random() * 7)   // 4-10: suited connectors are playable
      : 8 + Math.floor(Math.random() * 3);   // 8-10: filter low unsuited hands
    const suits = shuffle([...SUITS]);
    const r = (v: number) => {
      const entry = Object.entries(RANK_VALUES).find(([, val]) => val === v);
      return (entry?.[0] || '7') as Rank;
    };
    if (suited) {
      const holeSuit = suits[0];
      const offSuits = SUITS.filter(s => s !== holeSuit);
      const pick = () => offSuits[Math.floor(Math.random() * offSuits.length)];
      holeCards = [makeCard(r(startVal), holeSuit), makeCard(r(startVal + 1), holeSuit)];
      communityCards = [
        makeCard(r(startVal + 2), pick()),
        makeCard(r(startVal + 3), pick()),
        makeCard(randomRank(2, Math.max(2, startVal - 3)), pick()),
      ];
      if (street === 'Turn') {
        communityCards.push(makeCard(randomRank(2, Math.max(2, startVal - 4)), pick()));
      }
    } else {
      holeCards = [makeCard(r(startVal), suits[0]), makeCard(r(startVal + 1), suits[1])];
      communityCards = [
        makeCard(r(startVal + 2), suits[2]),
        makeCard(r(startVal + 3), suits[3]),
        makeCard(randomRank(2, Math.max(2, startVal - 3)), suits[0]),
      ];
      if (street === 'Turn') {
        communityCards.push(makeCard(randomRank(2, Math.max(2, startVal - 4)), suits[1]));
      }
    }
  } else {
    // Gutshot: missing one card in the middle of a straight
    const suited = Math.random() < 0.5;
    const startVal = suited
      ? 4 + Math.floor(Math.random() * 7)
      : 8 + Math.floor(Math.random() * 3);
    const suits = shuffle([...SUITS]);
    const r = (v: number) => {
      const entry = Object.entries(RANK_VALUES).find(([, val]) => val === v);
      return (entry?.[0] || '7') as Rank;
    };
    // Skip the middle card (startVal+2)
    if (suited) {
      const holeSuit = suits[0];
      const offSuits = SUITS.filter(s => s !== holeSuit);
      const pick = () => offSuits[Math.floor(Math.random() * offSuits.length)];
      holeCards = [makeCard(r(startVal), holeSuit), makeCard(r(startVal + 1), holeSuit)];
      communityCards = [
        makeCard(r(startVal + 3), pick()),
        makeCard(r(startVal + 4), pick()),
        makeCard(randomRank(2, Math.max(2, startVal - 3)), pick()),
      ];
      if (street === 'Turn') {
        communityCards.push(makeCard(randomRank(2, Math.max(2, startVal - 4)), pick()));
      }
    } else {
      holeCards = [makeCard(r(startVal), suits[0]), makeCard(r(startVal + 1), suits[1])];
      communityCards = [
        makeCard(r(startVal + 3), suits[2]),
        makeCard(r(startVal + 4), suits[3]),
        makeCard(randomRank(2, Math.max(2, startVal - 3)), suits[0]),
      ];
      if (street === 'Turn') {
        communityCards.push(makeCard(randomRank(2, Math.max(2, startVal - 4)), suits[1]));
      }
    }
  }

  return { holeCards, communityCards, drawType };
}

/**
 * Generate an outs/improvement question: "Which card improves your hand the most?"
 */
export function generateOutsImprovementQuestion(street: 'Flop' | 'Turn' = 'Flop'): Question {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const setup = constructDrawScenario(street);
    const { holeCards, communityCards } = setup;

    // Validate no duplicate cards
    const allCards = [...holeCards, ...communityCards];
    const cardSet = new Set(allCards.map(cardKey));
    if (cardSet.size !== allCards.length) continue;

    const outs = findOuts(holeCards, communityCards);
    if (outs.length < 4) continue;

    // Best out is the correct answer
    const bestOut = outs[0];

    // Pick 3 weaker outs as distractors — no shared rank or suit across all 4 options
    const usedRanks = new Set([bestOut.card.rank]);
    const usedSuits = new Set([bestOut.card.suit]);
    const distractorOuts: typeof outs = [];

    for (let i = 1; i < outs.length && distractorOuts.length < 3; i++) {
      const o = outs[i];
      if (usedRanks.has(o.card.rank) || usedSuits.has(o.card.suit)) continue;
      distractorOuts.push(o);
      usedRanks.add(o.card.rank);
      usedSuits.add(o.card.suit);
    }

    if (distractorOuts.length < 3) continue;

    const options: Option[] = [
      {
        id: 'opt_correct',
        label: `${bestOut.card.rank}${suitSymbol(bestOut.card.suit)}`,
        cards: [bestOut.card],
        isCorrect: true,
      },
      ...distractorOuts.map((o, i) => ({
        id: `opt_d${i}`,
        label: `${o.card.rank}${suitSymbol(o.card.suit)}`,
        cards: [o.card],
        isCorrect: false,
      })),
    ];

    const scenario: Scenario = {
      communityCards,
      holeCards,
      street,
    };

    // Only count outs that complete a made hand (Straight or better)
    const madeHandOuts = outs.filter(o => o.newHandType >= HandType.Straight);
    const outsCount = madeHandOuts.length;

    return {
      id: crypto.randomUUID(),
      category: 'outsImprovement',
      questionText: 'Which card would improve your hand the most?',
      scenario,
      options: shuffle(options),
      explanation: `You have ${outsCount} out${outsCount !== 1 ? 's' : ''}. The ${bestOut.card.rank}${suitSymbol(bestOut.card.suit)} gives you ${bestOut.newHandName}. ` +
        `Draw type: ${formatDrawType(setup.drawType)}.`,
    };
  }

  throw new Error('Failed to generate outs improvement question after max attempts');
}

function formatDrawType(type: DrawType): string {
  switch (type) {
    case 'flushDraw': return 'Flush Draw';
    case 'oesd': return 'Open-Ended Straight Draw';
    case 'gutshot': return 'Gutshot Straight Draw';
  }
}

function suitSymbol(suit: string): string {
  const symbols: Record<string, string> = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
  };
  return symbols[suit] || suit;
}
