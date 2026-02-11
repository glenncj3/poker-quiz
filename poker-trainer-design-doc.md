# Poker Training Quiz App — Design Document

## 1. Product Overview

**Name:** Poker Trainer (working title)
**Purpose:** A mobile-friendly web application where beginner poker players can take multiple-choice quizzes on Texas Hold'em situations. This is a training/education tool — users do NOT play poker.
**Target Audience:** Beginner Texas Hold'em players who want to build foundational skills.
**Deployment:** Static site on Netlify.

### What This App Is NOT
- Not a poker game or simulator
- Not a multi-player or social app
- Not a paid product — no monetization, no ads
- Not a logged-in experience — no accounts, no persistent user data

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React (Vite) | Fast dev, great ecosystem, user preference |
| Styling | Tailwind CSS | Rapid UI development, mobile-first utilities |
| Language | TypeScript | Type safety for card logic and quiz generation |
| Hosting | Netlify | Free tier, simple static deploys, user preference |
| State | React state (useState/useReducer) | No persistence needed; quiz state lives in-session only |
| Database | **None** | No user accounts, no saved progress — everything is generated client-side |

### Why No Backend or Database
All quiz questions are generated client-side using deterministic poker logic. There are no user accounts, no leaderboards, and no data to persist. A pure static React app is the simplest and most maintainable architecture.

---

## 3. Quiz Categories

The app offers **5 quiz categories**, each containing **10 dynamically generated multiple-choice questions** with explanations.

### Category 1: Hand Rankings
**Concept:** Given a set of 5 community cards and two or more complete hands, identify which hand is strongest.
**Question format:** "Which of these hands wins?"
**Options:** 4 different hole card combinations, each forming a different hand rank.
**Generation logic:**
- Deal 5 community cards
- Generate 4 sets of hole cards that produce hands of different ranks (e.g., flush vs. straight vs. two pair vs. pair)
- Correct answer is the highest-ranking hand
**Explanation:** Names the winning hand, explains why it beats the others in the hand ranking hierarchy.

### Category 2: Reading the Board (The Nuts)
**Concept:** Given 5 community cards, identify the best possible hand (the nuts) or second-best hand any player could hold.
**Question format:** "What is the best possible hand a player could have with this board?" or "What hole cards would give a player the nuts here?"
**Options:** 4 different hole card combinations; only one produces the actual nuts.
**Generation logic:**
- Deal 5 community cards
- Compute the nuts (best possible hand using any 2 hole cards + the board)
- Generate 3 plausible but inferior distractors (strong but not the nuts)
**Explanation:** Describes why the correct hole cards produce the best possible hand and why each distractor falls short.

### Category 3: Outs & Improvement
**Concept:** Given your hole cards and a flop or turn (3-4 community cards), identify the best card to improve your hand.
**Question format:** "Which card on the next street would most improve your hand?" or "Which of these turn/river cards helps you the most?"
**Options:** 4 possible next cards; one is clearly the best out.
**Generation logic:**
- Deal hole cards + flop (or turn) that create a draw (e.g., flush draw, straight draw, overcards)
- Identify the best possible improvement card
- Generate 3 cards that either don't help or help less
**Explanation:** Names the draw, explains outs, and why the correct card completes the best hand.

### Category 4: Bet or Check
**Concept:** Given a simplified game situation (your hand, the board, your position, pot size), decide whether to bet or check.
**Question format:** "You are [position] with [hand] on a [board]. The pot is [X]. Should you bet or check?"
**Options:** "Bet" or "Check" (2 options), plus a brief reason for each (e.g., "Bet — for value" / "Bet — as a bluff" / "Check — to pot control" / "Check — to trap"). So effectively 4 options.
**Generation logic:**
- Generate a scenario with defined parameters:
  - Hand strength (strong/medium/weak/draw)
  - Board texture (wet/dry)
  - Position (in position / out of position)
  - Pot size (small/medium/large relative to stacks)
- Use a rule-based decision engine to determine the "correct" beginner-level play
- The rules should encode simple, widely-agreed-upon beginner heuristics (e.g., "Bet strong hands for value," "Check weak hands out of position," "Bet draws on wet boards as semi-bluffs in position")
**Explanation:** Explains the reasoning using the heuristic that applies.

### Category 5: Fold, Call, or Raise
**Concept:** Facing a bet from an opponent, decide the best action.
**Question format:** "You hold [hand] on a [board]. Opponent bets [X] into a pot of [Y]. What should you do?"
**Options:** "Fold," "Call," or "Raise" — 3 options, potentially with a brief qualifier (e.g., "Call — you're getting good pot odds," "Raise — for value").
**Generation logic:**
- Generate scenario with:
  - Hand strength relative to the board
  - Bet sizing (small / half pot / pot / overbet)
  - Pot odds (favorable or not)
  - Draw potential
- Use rule-based logic:
  - Strong hands → Raise for value
  - Medium hands with good pot odds → Call
  - Draws with good pot odds → Call (or raise as semi-bluff)
  - Weak hands with poor pot odds → Fold
**Explanation:** Walks through the pot odds calculation (in simple terms) and hand strength assessment.

---

## 4. Dynamic Question Generation Engine

### Overview
All questions are generated at quiz start using client-side JavaScript/TypeScript. No pre-authored question bank is needed.

### Core Poker Logic Module

This module must implement:

#### Card Representation
```
Suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
Rank: '2' | '3' | ... | '10' | 'J' | 'Q' | 'K' | 'A'
Card: { rank: Rank, suit: Suit }
```

#### Deck Management
- `createDeck()`: Returns a shuffled 52-card deck
- `drawCards(deck, n)`: Draws n cards, returns drawn cards and remaining deck

#### Hand Evaluation
- `evaluateHand(holeCards: Card[], communityCards: Card[])`: Returns the best 5-card hand from 7 cards
- Must detect: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, High Card
- Must return a **hand rank score** (numeric) for comparison, plus a **human-readable name**
- Must handle edge cases: Ace-low straights (A-2-3-4-5), split pots, kickers

#### Nuts Calculator
- `findNuts(communityCards: Card[])`: Given 5 community cards, iterate over all possible 2-card combinations from the remaining deck. Return the hole cards that produce the highest-ranking hand.

#### Outs Calculator
- `findOuts(holeCards: Card[], communityCards: Card[])`: Given hole cards and 3-4 community cards, compute which remaining cards improve the hand and by how much.

#### Pot Odds Calculator
- `calculatePotOdds(potSize: number, betSize: number)`: Returns the pot odds as a ratio and percentage.

### Question Generator Module

Each category has a generator function:
```
generateHandRankingQuestion(): Question
generateNutsQuestion(): Question
generateOutsQuestion(): Question
generateBetCheckQuestion(): Question
generateFoldCallRaiseQuestion(): Question
```

Each returns:
```typescript
interface Question {
  id: string;
  category: string;
  scenario: {
    communityCards: Card[];
    holeCards?: Card[];        // Player's hole cards (if relevant)
    position?: string;         // 'Early' | 'Middle' | 'Late' | 'Big Blind' | 'Small Blind'
    potSize?: number;          // In big blinds
    betSize?: number;          // Opponent's bet in big blinds (if facing a bet)
    streetName?: string;       // 'Flop' | 'Turn' | 'River'
    additionalContext?: string; // e.g., "You are heads-up against one opponent"
  };
  questionText: string;
  options: {
    id: string;
    label: string;
    description?: string;      // Optional clarifier
  }[];
  correctOptionId: string;
  explanation: string;
}
```

### Distractor Generation Strategy
Generating *plausible but wrong* answers is critical for good quizzes:
- **Hand Rankings:** Pick hands that are close in rank (e.g., if the correct answer is a flush, distractors might be a straight, two pair, and three of a kind)
- **Nuts:** Pick hole cards that make strong hands but not the absolute nuts
- **Outs:** Pick cards of the right suit but wrong rank, or right rank but wrong suit
- **Bet/Check & Fold/Call/Raise:** All options are always shown; the wrong ones have plausible-sounding but incorrect reasoning

### Quality Checks
The generator should validate each question before including it:
- No duplicate cards across community + hole cards + distractors
- Correct answer is unambiguously correct
- Distractors are all distinct from each other
- At least one distractor is "tempting" (close to correct)

---

## 5. Visual Card & Table Design

### Card Rendering
Cards must be rendered visually — not as text like "Ah" or "Ks".

**Approach: SVG-based card components in React.**

Each card component renders:
- A rounded rectangle (white with subtle border)
- The rank in the top-left and bottom-right corners
- The suit symbol in the center (large) and corners (small)
- Red for hearts/diamonds, black for spades/clubs
- Cards should be recognizable at mobile sizes (minimum ~50px wide)

**Card back:** A simple design for face-down cards (used when showing opponent's unknown hand).

### Table Layout
The quiz scenario display should include:
- **Community cards:** Displayed in a horizontal row in the center, face-up, styled as if on a green felt surface
- **Player's hole cards:** Displayed below the community cards, slightly larger or highlighted
- **Opponent's hole cards (in hand ranking questions):** Displayed in separate rows, labeled "Player A," "Player B," etc.
- **Game info bar:** Shows pot size, bet size, position, and street when relevant
- **Green felt background:** The card area should have a poker-table green (#35654d or similar) background with rounded corners to evoke a table

### Responsive Design
- Cards scale down on smaller screens but remain legible
- On narrow mobile screens (<400px), community cards may wrap to 2 rows (3 + 2) if needed
- Touch-friendly: answer option buttons should be at least 44px tall with ample spacing

---

## 6. UI / UX Design

### Screen Flow

```
[Home Screen] → [Category Select] → [Quiz (10 questions)] → [Results Screen]
                                          ↕
                                    [Question + Explanation]
```

### Home Screen
- App title and brief tagline ("Learn Texas Hold'em, one hand at a time")
- Poker-themed visual (simple illustration or card motif)
- "Start Quiz" button (prominent)
- Brief description of what the app does

### Category Selection Screen
- 5 cards/tiles, one for each category
- Each tile shows:
  - Category name
  - One-line description
  - Icon or small visual
- Tap a tile to start that quiz
- Optional: "Random Mix" option that pulls 2 questions from each category

### Quiz Screen (per question)
- **Progress bar** at top: "Question 3 of 10"
- **Scenario area** (top ~60% of screen):
  - Green felt table background
  - Community cards displayed prominently
  - Player's hole cards (if relevant)
  - Game context info (pot size, bet size, position) in a clean info bar
- **Question text** below the scenario
- **Answer options** as large, tappable buttons (stacked vertically on mobile)
  - Not yet answered: neutral style
  - After answering: correct option turns green, wrong selection turns red, other options gray out
- **"Next" button** appears after answering (bottom of screen)

### Explanation Modal/Panel
After selecting an answer:
- The correct answer highlights in green
- If the user was wrong, their selection highlights in red
- An explanation panel slides up or expands below the options:
  - "✓ Correct!" or "✗ Incorrect"
  - 2-4 sentence explanation of the correct answer
  - For hand ranking / nuts questions: names the winning hand
  - For outs questions: lists the key outs
  - For action questions: walks through the reasoning
- "Next Question" button at the bottom

### Results Screen
- Score: "You got 7 out of 10 correct!"
- Simple visual (e.g., a progress ring or bar)
- Per-question summary: list of questions with ✓/✗ icons (tap to review explanation)
- "Try Again" button (regenerates the same category)
- "Choose Another Category" button (back to category select)
- "Go Home" button

### Visual Design Guidelines
- **Color palette:**
  - Primary green (poker felt): #35654d
  - Dark background: #1a1a2e
  - Card white: #ffffff
  - Correct green: #22c55e
  - Incorrect red: #ef4444
  - Accent gold: #f59e0b
  - Text: #f8fafc (light on dark backgrounds)
- **Typography:** Clean sans-serif (Inter or system font stack)
- **Vibe:** Dark-themed, poker lounge aesthetic. Clean and approachable, not flashy or casino-gaudy.
- **Animations:** Subtle — card flip when revealing, slide transitions between questions, highlight pulse on correct/incorrect. Keep it performant on mobile.

---

## 7. Project Structure

```
poker-trainer/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router / screen management
│   ├── types/
│   │   ├── card.ts                 # Card, Suit, Rank types
│   │   └── quiz.ts                 # Question, QuizState, etc.
│   ├── engine/
│   │   ├── deck.ts                 # Deck creation, shuffling, drawing
│   │   ├── evaluator.ts            # Hand evaluation (7 cards → best 5)
│   │   ├── nuts.ts                 # Nuts calculator
│   │   ├── outs.ts                 # Outs calculator
│   │   ├── odds.ts                 # Pot odds calculator
│   │   └── generators/
│   │       ├── handRanking.ts      # Hand Rankings question generator
│   │       ├── nutsReading.ts      # Reading the Board question generator
│   │       ├── outsImprovement.ts  # Outs & Improvement question generator
│   │       ├── betOrCheck.ts       # Bet or Check question generator
│   │       └── foldCallRaise.ts    # Fold/Call/Raise question generator
│   ├── components/
│   │   ├── Card.tsx                # Single card SVG component
│   │   ├── CardRow.tsx             # Row of cards (community / hole cards)
│   │   ├── PokerTable.tsx          # Green felt table layout with cards
│   │   ├── GameInfo.tsx            # Pot size, bet size, position display
│   │   ├── QuestionDisplay.tsx     # Question text + options
│   │   ├── OptionButton.tsx        # Individual answer button
│   │   ├── Explanation.tsx         # Post-answer explanation panel
│   │   ├── ProgressBar.tsx         # Quiz progress indicator
│   │   ├── ScoreRing.tsx           # Results screen score visual
│   │   └── CategoryCard.tsx        # Category selection tile
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── CategorySelectScreen.tsx
│   │   ├── QuizScreen.tsx          # Manages quiz state, iterates questions
│   │   └── ResultsScreen.tsx
│   ├── hooks/
│   │   └── useQuiz.ts              # Quiz state management hook
│   ├── utils/
│   │   └── shuffle.ts              # Fisher-Yates shuffle
│   └── styles/
│       └── index.css               # Tailwind imports + custom poker styles
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── package.json
├── netlify.toml                    # Netlify build config
└── README.md
```

---

## 8. Key Implementation Notes

### Hand Evaluator Complexity
The hand evaluator is the most complex piece of logic. It must:
1. Take 7 cards (2 hole + 5 community)
2. Generate all 21 possible 5-card combinations (C(7,5) = 21)
3. Evaluate each 5-card hand
4. Return the best one

**Recommended approach:** Assign each hand type a tier (0-9), then within each tier, use card ranks for comparison. Return a composite numeric score that allows direct comparison with `>`.

### Scenario Heuristic Engine (Categories 4 & 5)
For the Bet/Check and Fold/Call/Raise categories, the "correct" answer is determined by beginner-level heuristics, NOT by GTO (Game Theory Optimal) strategy. Keep the rules simple and widely agreed-upon:

**Bet or Check heuristics:**
| Hand Strength | In Position | Out of Position |
|--------------|-------------|-----------------|
| Strong (top pair+) | Bet for value | Bet for value |
| Medium (middle pair) | Check or small bet | Check |
| Draw (flush/straight draw) | Bet (semi-bluff) | Check or bet small |
| Weak (no pair, no draw) | Check (or bluff rarely) | Check |

**Fold/Call/Raise heuristics:**
| Hand Strength | Good Pot Odds | Bad Pot Odds |
|--------------|---------------|--------------|
| Strong | Raise | Raise |
| Medium | Call | Fold or Call |
| Draw | Call | Fold |
| Weak | Fold | Fold |

These tables are simplifications. The explanations should acknowledge this: "As a general beginner guideline..."

### Distractor Card Dealing
When generating distractor hole cards for hand ranking or nuts questions, deal them from the remaining deck (excluding community cards and the correct answer's hole cards). Verify no card appears twice.

### Shuffling
Use Fisher-Yates shuffle for all randomization. Do not use `Math.random()` sort — it produces biased results.

---

## 9. Netlify Deployment

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Build
Vite produces a static `dist/` folder. Netlify serves it. The redirect rule ensures client-side routing works for direct URL access.

---

## 10. Future Enhancements (Out of Scope for V1)

These are explicitly **not** part of the initial build, but noted for potential future development:

- User accounts and progress tracking (would require Supabase or similar)
- Spaced repetition (re-quiz on questions you got wrong)
- Difficulty levels (intermediate, advanced)
- AI-powered explanations (Claude API generating dynamic explanations)
- Pre-flop hand selection quiz category
- Tournament-specific scenarios (ICM, bubble play)
- Multi-player challenge mode
- Hand history import and quiz generation from real hands
- Omaha and other variants

---

## 11. Acceptance Criteria (Definition of Done)

The V1 is complete when:

1. **Home screen** loads with app title, description, and start button
2. **Category selection** shows all 5 categories with descriptions
3. **Each category** generates 10 unique, valid questions per quiz session
4. **Card visuals** render correctly on mobile (iPhone SE width and up) and desktop
5. **Answer flow** works: tap answer → highlight correct/incorrect → show explanation → next
6. **Results screen** shows score with per-question review
7. **Navigation** works: home → categories → quiz → results → back to categories or home
8. **No broken states**: completing a quiz, going back, restarting all work without errors
9. **Mobile-first**: fully usable on a phone in portrait orientation
10. **Deploys to Netlify** as a static site with working routes
