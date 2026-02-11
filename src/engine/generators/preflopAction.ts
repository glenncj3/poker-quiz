import type { Question, Option, Scenario } from '../../types/quiz';
import { createDeck, drawCards, cardKey } from '../deck';
import { shuffle } from '../../utils/shuffle';
import { classifyPreflopHand, handNotation, PreflopTier } from '../preflop';

type HeroPosition = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';
type ActionId = 'raiseSmall' | 'raiseBig' | 'limp' | 'fold' | 'reraiseSmall' | 'reraiseBig' | 'call';

interface RfiLabels {
  raiseSmall: string;
  raiseBig: string;
  limp: string;
  fold: string;
}

interface FacingLabels {
  reraiseSmall: string;
  reraiseBig: string;
  call: string;
  fold: string;
}

const RFI_LABELS: RfiLabels = {
  raiseSmall: 'Raise Small',
  raiseBig: 'Raise Big',
  limp: 'Limp',
  fold: 'Fold',
};

const FACING_LABELS: FacingLabels = {
  reraiseSmall: 'Reraise Small',
  reraiseBig: 'Reraise Big',
  call: 'Call',
  fold: 'Fold',
};

// Positions available for RFI (BB never RFIs — wins uncontested)
const RFI_POSITIONS: HeroPosition[] = ['UTG', 'MP', 'CO', 'BTN', 'SB'];
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
  // $30-$300 in $5 increments
  return randomInt(6, 60) * 5;
}

/** Pick a random villain position that is before hero in action order for facing-raise. */
function pickVillainPosition(heroPos: HeroPosition): HeroPosition {
  const order: HeroPosition[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const heroIdx = order.indexOf(heroPos);
  // Villain must have acted before hero (lower index = earlier position)
  const candidates = order.slice(0, heroIdx);
  if (candidates.length === 0) return 'UTG'; // fallback (shouldn't happen if hero isn't UTG)
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Is hero in position relative to villain? */
export function heroIsIP(heroPos: HeroPosition, villainPos: HeroPosition): boolean {
  const order: HeroPosition[] = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'];
  // Postflop position order: SB acts first, BTN acts last
  return order.indexOf(heroPos) > order.indexOf(villainPos);
}

// ── RFI Strategy ──

export function getRfiAction(
  tier: PreflopTier,
  pos: HeroPosition,
  heroStack: number,
): ActionId {
  const shortStack = heroStack <= 40;

  if (tier === PreflopTier.Premium) {
    return 'raiseBig';
  }

  if (tier === PreflopTier.Strong) {
    if (shortStack) return 'raiseBig';
    if (isLP(pos)) return 'raiseSmall';
    return 'raiseBig'; // EP or SB
  }

  if (tier === PreflopTier.Playable) {
    if (isEP(pos)) return 'fold';
    if (shortStack) return 'raiseBig';
    return 'raiseSmall'; // CO, BTN, SB
  }

  if (tier === PreflopTier.Marginal) {
    if (pos === 'BTN') {
      return shortStack ? 'raiseBig' : 'raiseSmall';
    }
    return 'fold';
  }

  return 'fold'; // Weak
}

// ── Facing Raise Strategy ──

export function getFacingRaiseAction(
  tier: PreflopTier,
  ip: boolean,
  effectiveStack: number,
): ActionId {
  const shortStack = effectiveStack <= 40;
  const deepStack = effectiveStack >= 160;

  if (tier === PreflopTier.Premium) {
    return 'reraiseBig';
  }

  if (tier === PreflopTier.Strong) {
    if (shortStack) return 'reraiseBig';
    return ip ? 'reraiseSmall' : 'reraiseBig';
  }

  if (tier === PreflopTier.Playable) {
    if (shortStack) return 'fold';
    if (ip) return 'call'; // deep implied odds or standard
    if (deepStack && ip) return 'call'; // redundant but explicit
    return 'fold'; // OOP
  }

  if (tier === PreflopTier.Marginal) {
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
  return 'the blinds';
}

function buildRfiExplanation(
  notation: string,
  tier: PreflopTier,
  pos: HeroPosition,
  heroStack: number,
  action: ActionId,
): string {
  const tn = tierName(tier);
  const pg = positionGroup(pos);
  let sizing = '';
  if (action === 'raiseBig') {
    sizing = heroStack <= 40
      ? ` With a short stack ($${heroStack}), shoving is the best play.`
      : ' A larger raise size builds the pot with your strong holding.';
  } else if (action === 'raiseSmall') {
    sizing = ` A standard open from ${pg} keeps your range balanced.`;
  } else if (action === 'fold') {
    sizing = ` This hand is too weak to open from ${pg}.`;
  }
  return `${notation} is a ${tn} hand.${sizing}`;
}

function buildFacingRaiseExplanation(
  notation: string,
  tier: PreflopTier,
  ip: boolean,
  effectiveStack: number,
  action: ActionId,
): string {
  const tn = tierName(tier);
  const posDesc = ip ? 'in position' : 'out of position';
  let sizing = '';
  if (action === 'reraiseBig') {
    sizing = effectiveStack <= 40
      ? ` With a short effective stack ($${effectiveStack}), shoving maximizes fold equity.`
      : ' A large 3-bet extracts value and narrows villain\'s range.';
  } else if (action === 'reraiseSmall') {
    sizing = ' A smaller 3-bet keeps villain\'s weaker hands in while building the pot.';
  } else if (action === 'call') {
    sizing = ` Calling ${posDesc} with implied odds is profitable at this stack depth.`;
  } else if (action === 'fold') {
    sizing = ` This hand doesn't have the strength to continue ${posDesc}.`;
  }
  return `${notation} is a ${tn} hand ${posDesc}.${sizing}`;
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
    const isRfi = Math.random() < 0.5;

    if (isRfi) {
      // ── RFI scenario ──
      const pos = RFI_POSITIONS[Math.floor(Math.random() * RFI_POSITIONS.length)];
      const heroStack = randomStack();
      const action = getRfiAction(tier, pos, heroStack);

      // Limp is never correct but is always shown as a trap option
      if (action === 'limp') continue;

      const options: Option[] = [
        { id: 'raiseSmall', label: RFI_LABELS.raiseSmall, isCorrect: action === 'raiseSmall' },
        { id: 'raiseBig', label: RFI_LABELS.raiseBig, isCorrect: action === 'raiseBig' },
        { id: 'limp', label: RFI_LABELS.limp, isCorrect: false },
        { id: 'fold', label: RFI_LABELS.fold, isCorrect: action === 'fold' },
      ];

      const scenario: Scenario = {
        communityCards: [],
        holeCards,
        position: pos,
        street: 'Preflop',
        heroStack,
      };

      const questionText = `Action folds to you in the ${pos} ($${heroStack} stack). What do you do?`;
      const explanation = buildRfiExplanation(notation, tier, pos, heroStack, action);

      return {
        id: crypto.randomUUID(),
        category: 'preflopAction',
        questionText,
        scenario,
        options: shuffle(options),
        explanation,
      };
    } else {
      // ── Facing a Raise scenario ──
      // Hero can be any position except UTG (need someone before to raise)
      const facingPositions: HeroPosition[] = ['MP', 'CO', 'BTN', 'SB', 'BB'];
      const heroPos = facingPositions[Math.floor(Math.random() * facingPositions.length)];
      const villainPos = pickVillainPosition(heroPos);
      const heroStack = randomStack();
      const villainStack = randomStack();
      const effectiveStack = Math.min(heroStack, villainStack);
      const ip = heroIsIP(heroPos, villainPos);
      const action = getFacingRaiseAction(tier, ip, effectiveStack);

      // Determine villain's open raise size
      const openSize = randomInt(5, 8); // $5-$8

      const options: Option[] = [
        { id: 'reraiseSmall', label: FACING_LABELS.reraiseSmall, isCorrect: action === 'reraiseSmall' },
        { id: 'reraiseBig', label: FACING_LABELS.reraiseBig, isCorrect: action === 'reraiseBig' },
        { id: 'call', label: FACING_LABELS.call, isCorrect: action === 'call' },
        { id: 'fold', label: FACING_LABELS.fold, isCorrect: action === 'fold' },
      ];

      const scenario: Scenario = {
        communityCards: [],
        holeCards,
        position: heroPos,
        street: 'Preflop',
        heroStack,
        villainStack,
        betSize: openSize,
      };

      const questionText = `${villainPos} ($${villainStack}) raises to $${openSize}. You are on the ${heroPos} ($${heroStack}). What do you do?`;
      const explanation = buildFacingRaiseExplanation(notation, tier, ip, effectiveStack, action);

      return {
        id: crypto.randomUUID(),
        category: 'preflopAction',
        questionText,
        scenario,
        options: shuffle(options),
        explanation,
      };
    }
  }

  throw new Error('Failed to generate preflop action question after max attempts');
}
