import type { Question, Option, Scenario } from '../../types/quiz';
import { RANK_VALUES } from '../../types/card';
import { createDeck, drawCards, cardKey } from '../deck';
import { shuffle } from '../../utils/shuffle';
import { classifyPreflopHand, handNotation, PreflopTier } from '../preflop';

type HeroPosition = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';
export type ActionId = 'betSmall' | 'betBig' | 'call' | 'fold';

export const ACTION_LABELS: Record<ActionId, string> = {
  betSmall: 'Bet Small',
  betBig: 'Bet Big',
  call: 'Call',
  fold: 'Fold',
};

const POSITIONS: HeroPosition[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

function positionFullName(pos: HeroPosition): string {
  switch (pos) {
    case 'UTG': return 'early position (UTG)';
    case 'MP': return 'middle position (MP)';
    case 'CO': return 'the cutoff (CO)';
    case 'BTN': return 'the dealer seat (BTN)';
    case 'SB': return 'the small blind (SB)';
    case 'BB': return 'the big blind (BB)';
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStack(): number {
  return randomInt(6, 60) * 5;
}

/*
 * Decision matrix (7 tiers × 6 positions):
 *
 * Tier        | UTG        | MP         | CO/BTN     | SB         | BB
 * ------------|------------|------------|------------|------------|------------
 * Premium     | betBig     | betBig     | betBig     | betBig     | betBig
 * Strong      | betBig     | betBig     | betSmall   | betBig     | betBig
 * UTG Open    | betSmall   | betSmall   | betSmall   | betSmall   | betSmall
 * MP Open     | fold       | betSmall   | betSmall   | betSmall   | betSmall
 * LP Open     | fold       | fold       | betSmall   | betSmall   | betSmall
 * Steal       | fold       | fold       | BTN:betSm  | call       | betSmall
 * Trash       | fold       | fold       | fold       | fold       | fold
 *
 * Short-stack override (≤40 BBs): any non-fold action becomes betBig.
 */
export function getPreflopAction(
  tier: PreflopTier,
  pos: HeroPosition,
  stack: number,
): ActionId {
  const shortStack = stack <= 40;

  // Premium: always bet big
  if (tier === PreflopTier.Premium) {
    return 'betBig';
  }

  // Strong: raise from everywhere; big from EP/SB/BB, small from CO/BTN
  if (tier === PreflopTier.Strong) {
    if (shortStack) return 'betBig';
    if (pos === 'CO' || pos === 'BTN') return 'betSmall';
    return 'betBig';
  }

  // UTG Open: raise small from all positions
  if (tier === PreflopTier.UTGOpen) {
    if (shortStack) return 'betBig';
    return 'betSmall';
  }

  // MP Open: fold from UTG, raise from MP+
  if (tier === PreflopTier.MPOpen) {
    if (pos === 'UTG') return 'fold';
    if (shortStack) return 'betBig';
    return 'betSmall';
  }

  // LP Open: fold from UTG/MP, raise from CO+
  if (tier === PreflopTier.LPOpen) {
    if (pos === 'UTG' || pos === 'MP') return 'fold';
    if (shortStack) return 'betBig';
    return 'betSmall';
  }

  // Steal: BTN raise, SB call, BB raise, fold elsewhere
  if (tier === PreflopTier.Steal) {
    if (pos === 'SB') return shortStack ? 'fold' : 'call';
    if (pos === 'BTN' || pos === 'BB') {
      if (shortStack) return 'betBig';
      return 'betSmall';
    }
    return 'fold';
  }

  // Trash: always fold
  return 'fold';
}

// ── Explanation helpers ──

function tierName(tier: PreflopTier): string {
  switch (tier) {
    case PreflopTier.Premium: return 'premium';
    case PreflopTier.Strong: return 'strong';
    case PreflopTier.UTGOpen: return 'solid';
    case PreflopTier.MPOpen: return 'playable';
    case PreflopTier.LPOpen: return 'speculative';
    case PreflopTier.Steal: return 'marginal';
    default: return 'weak';
  }
}

function positionGroup(pos: HeroPosition): string {
  switch (pos) {
    case 'UTG': return 'early position';
    case 'MP': return 'middle position';
    case 'CO': return 'the cutoff';
    case 'BTN': return 'the button';
    case 'SB': return 'the small blind';
    case 'BB': return 'the big blind';
  }
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
    sizing = ` A small raise from ${pg} is a solid play with this hand.`;
  } else if (action === 'call') {
    sizing = ' Calling from the small blind is worthwhile — your cards have potential to improve.';
  } else if (action === 'fold') {
    // Use "risky" language for hands that are close to playable from this position
    const isRisky =
      (tier === PreflopTier.MPOpen && pos === 'UTG') ||
      (tier === PreflopTier.LPOpen && (pos === 'UTG' || pos === 'MP'));
    if (isRisky) {
      sizing = ` This hand is risky from ${pg} — it plays better from later positions.`;
    } else {
      sizing = ` This hand is too weak to play from ${pg}.`;
    }
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
