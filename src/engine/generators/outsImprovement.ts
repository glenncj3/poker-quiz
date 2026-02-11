import type { Card, Suit, Rank } from '../../types/card';
import type { Question, Option, Scenario } from '../../types/quiz';
import { SUITS, RANKS, RANK_VALUES } from '../../types/card';
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
    const startVal = 4 + Math.floor(Math.random() * 7); // 4-10
    const suits = shuffle([...SUITS]);
    const r = (v: number) => {
      const entry = Object.entries(RANK_VALUES).find(([, val]) => val === v);
      return (entry?.[0] || '7') as Rank;
    };
    holeCards = [makeCard(r(startVal), suits[0]), makeCard(r(startVal + 1), suits[1])];
    communityCards = [
      makeCard(r(startVal + 2), suits[2]),
      makeCard(r(startVal + 3), suits[3]),
      makeCard(randomRank(2, Math.max(2, startVal - 3)), suits[0]),
    ];
    if (street === 'Turn') {
      // Add a low card far from the straight range to keep the draw open
      const safeRank = randomRank(2, Math.max(2, startVal - 4));
      communityCards.push(makeCard(safeRank, suits[1]));
    }
  } else {
    // Gutshot: missing one card in the middle of a straight
    const startVal = 4 + Math.floor(Math.random() * 7);
    const suits = shuffle([...SUITS]);
    const r = (v: number) => {
      const entry = Object.entries(RANK_VALUES).find(([, val]) => val === v);
      return (entry?.[0] || '7') as Rank;
    };
    // Skip the middle card (startVal+2)
    holeCards = [makeCard(r(startVal), suits[0]), makeCard(r(startVal + 1), suits[1])];
    communityCards = [
      makeCard(r(startVal + 3), suits[2]),
      makeCard(r(startVal + 4), suits[3]),
      makeCard(randomRank(2, Math.max(2, startVal - 3)), suits[0]),
    ];
    if (street === 'Turn') {
      const safeRank = randomRank(2, Math.max(2, startVal - 4));
      communityCards.push(makeCard(safeRank, suits[1]));
    }
  }

  return { holeCards, communityCards, drawType };
}

/**
 * Generate an outs/improvement question: "Which card improves your hand the most?"
 */
export function generateOutsImprovementQuestion(): Question {
  const maxAttempts = 50;
  const street = Math.random() < 0.7 ? 'Flop' : 'Turn';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const setup = constructDrawScenario(street);
    const { holeCards, communityCards } = setup;

    // Validate no duplicate cards
    const allCards = [...holeCards, ...communityCards];
    const cardSet = new Set(allCards.map(cardKey));
    if (cardSet.size !== allCards.length) continue;

    const outs = findOuts(holeCards, communityCards);
    if (outs.length === 0) continue;

    // Best out is the correct answer
    const bestOut = outs[0];

    // Find 3 non-improving cards as distractors
    const usedKeys = new Set(allCards.map(cardKey));
    const outsKeys = new Set(outs.map(o => cardKey(o.card)));
    const nonOuts: Card[] = [];

    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const card = makeCard(rank, suit);
        const key = cardKey(card);
        if (!usedKeys.has(key) && !outsKeys.has(key)) {
          nonOuts.push(card);
        }
        if (nonOuts.length >= 20) break;
      }
      if (nonOuts.length >= 20) break;
    }

    if (nonOuts.length < 3) continue;

    const distractorCards = shuffle(nonOuts).slice(0, 3);

    const options: Option[] = [
      {
        id: 'opt_correct',
        label: `${bestOut.card.rank}${suitSymbol(bestOut.card.suit)}`,
        cards: [bestOut.card],
        isCorrect: true,
      },
      ...distractorCards.map((c, i) => ({
        id: `opt_d${i}`,
        label: `${c.rank}${suitSymbol(c.suit)}`,
        cards: [c],
        isCorrect: false,
      })),
    ];

    const scenario: Scenario = {
      communityCards,
      holeCards,
      street,
    };

    const outsCount = outs.length;

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
