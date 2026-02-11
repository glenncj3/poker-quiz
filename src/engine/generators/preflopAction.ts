import type { Question, Option, Scenario } from '../../types/quiz';
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
      ? ` With a short stack ($${stack}), shoving is the best play.`
      : ' A larger raise size builds the pot with your strong holding.';
  } else if (action === 'betSmall') {
    sizing = ` A standard open from ${pg} keeps your range balanced.`;
  } else if (action === 'call') {
    sizing = ' Completing from the small blind with a speculative hand is profitable.';
  } else if (action === 'fold') {
    sizing = ` This hand is too weak to play from ${pg}.`;
  }
  return `${notation} is a ${tn} hand.${sizing}`;
}

// ── Main generator ──

export function generatePreflopActionQuestion(): Question {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createDeck();
    const { drawn: holeCards } = drawCards(deck, 2);

    const cardSet = new Set(holeCards.map(cardKey));
    if (cardSet.size !== 2) continue;

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

    const questionText = `You are in the ${pos} ($${stack} stack). What do you do?`;
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
