import type { Question, Option, Scenario } from '../../types/quiz';
import { RANK_VALUES } from '../../types/card';
import { createDeck, drawCards, cardKey } from '../deck';
import { shuffle } from '../../utils/shuffle';
import { classifyPreflopHand, handNotation, PreflopTier } from '../preflop';

type HeroPosition = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB';
export type ActionId = 'betSmall' | 'betBig' | 'call' | 'fold';

export const ACTION_LABELS: Record<ActionId, string> = {
  betSmall: 'Bet Small',
  betBig: 'Bet Big',
  call: 'Call',
  fold: 'Fold',
};

const POSITIONS: HeroPosition[] = ['UTG', 'MP', 'CO', 'BTN', 'SB'];

function isEP(pos: HeroPosition): boolean {
  return pos === 'UTG' || pos === 'MP';
}

function isLP(pos: HeroPosition): boolean {
  return pos === 'CO' || pos === 'BTN';
}

function positionFullName(pos: HeroPosition): string {
  switch (pos) {
    case 'UTG': return 'early position (UTG)';
    case 'MP': return 'middle position (MP)';
    case 'CO': return 'the cutoff (CO)';
    case 'BTN': return 'the dealer seat (BTN)';
    case 'SB': return 'the small blind (SB)';
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStack(): number {
  return randomInt(6, 60) * 5;
}

export function getPreflopAction(
  tier: PreflopTier,
  pos: HeroPosition,
  stack: number,
): ActionId {
  const shortStack = stack <= 40;

  if (tier === PreflopTier.Premium) {
    return 'betBig';
  }

  if (tier === PreflopTier.Strong) {
    if (shortStack) return 'betBig';
    if (isLP(pos)) return 'betSmall';
    return 'betBig'; // EP or SB
  }

  if (tier === PreflopTier.Playable) {
    if (isEP(pos)) return 'fold';
    if (shortStack) return 'betBig';
    return 'betSmall'; // CO, BTN, SB
  }

  if (tier === PreflopTier.Marginal) {
    if (shortStack) return 'fold';
    if (pos === 'SB') return 'call';
    if (pos === 'BTN') return 'betSmall';
    return 'fold';
  }

  return 'fold'; // Weak
}

// ── Explanation helpers ──

function tierName(tier: PreflopTier): string {
  switch (tier) {
    case PreflopTier.Premium: return 'premium';
    case PreflopTier.Strong: return 'strong';
    case PreflopTier.Playable: return 'playable';
    case PreflopTier.Marginal: return 'marginal';
    default: return 'weak';
  }
}

function positionGroup(pos: HeroPosition): string {
  if (isEP(pos)) return 'early position';
  if (isLP(pos)) return 'late position';
  return 'the small blind';
}

function buildExplanation(
  notation: string,
  tier: PreflopTier,
  pos: HeroPosition,
  stack: number,
  action: ActionId,
): string {
  const tn = tierName(tier);
  const pg = positionGroup(pos);
  let sizing = '';
  if (action === 'betBig') {
    sizing = stack <= 40
      ? ` With only $${stack} in chips, going all-in is the best move.`
      : ' A bigger bet builds the pot when you have strong cards like these.';
  } else if (action === 'betSmall') {
    sizing = ` A small bet from ${pg} is a solid play with this hand.`;
  } else if (action === 'call') {
    sizing = ' Calling from the small blind is worthwhile — your cards have potential to improve.';
  } else if (action === 'fold') {
    sizing = ` This hand is too weak to play from ${pg}.`;
  }
  return `${notation} is a ${tn} hand.${sizing}`;
}

// ── Main generator ──

export function generatePreflopActionQuestion(options?: { filtered?: boolean }): Question {
  const filtered = options?.filtered ?? true;
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: holeCards } = drawCards(deck, 2);

    const cardSet = new Set(holeCards.map(cardKey));
    if (cardSet.size !== 2) continue;

    // Filter out unsuited hands where any card is 7 or lower
    if (filtered) {
      const suited = holeCards[0].suit === holeCards[1].suit;
      if (!suited) {
        const v0 = RANK_VALUES[holeCards[0].rank];
        const v1 = RANK_VALUES[holeCards[1].rank];
        if (v0 <= 7 || v1 <= 7) continue;
      }
    }

    const tier = classifyPreflopHand(holeCards);
    const notation = handNotation(holeCards);
    const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    const stack = randomStack();
    const action = getPreflopAction(tier, pos, stack);

    const options: Option[] = [
      { id: 'betSmall', label: ACTION_LABELS.betSmall, isCorrect: action === 'betSmall' },
      { id: 'betBig', label: ACTION_LABELS.betBig, isCorrect: action === 'betBig' },
      { id: 'call', label: ACTION_LABELS.call, isCorrect: action === 'call' },
      { id: 'fold', label: ACTION_LABELS.fold, isCorrect: action === 'fold' },
    ];

    const scenario: Scenario = {
      communityCards: [],
      holeCards,
      position: pos,
      street: 'Preflop',
      heroStack: stack,
    };

    const questionText = `You are in ${positionFullName(pos)} with $${stack} in chips. What do you do?`;
    const explanation = buildExplanation(notation, tier, pos, stack, action);

    return {
      id: crypto.randomUUID(),
      category: 'preflopAction',
      questionText,
      scenario,
      options: shuffle(options),
      explanation,
    };
  }

  throw new Error('Failed to generate preflop action question after max attempts');
}
