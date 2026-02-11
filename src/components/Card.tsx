import type { Card as CardType, Suit } from '../types/card';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  xs: { w: 40, h: 56, fontSize: 10, suitSize: 13 },
  sm: { w: 48, h: 68, fontSize: 12, suitSize: 16 },
  md: { w: 64, h: 90, fontSize: 16, suitSize: 22 },
  lg: { w: 80, h: 112, fontSize: 20, suitSize: 28 },
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#e74c3c',
  diamonds: '#e74c3c',
  clubs: '#2c3e50',
  spades: '#2c3e50',
};

export function Card({ card, faceDown = false, size = 'md' }: CardProps) {
  const { w, h, fontSize, suitSize } = SIZE_MAP[size];

  if (faceDown || !card) {
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="drop-shadow-md"
        aria-label="Face-down card"
      >
        <rect x="1" y="1" width={w - 2} height={h - 2} rx="6" ry="6"
          fill="#1a5276" stroke="#2980b9" strokeWidth="1.5" />
        <rect x="6" y="6" width={w - 12} height={h - 12} rx="3" ry="3"
          fill="none" stroke="#2980b9" strokeWidth="0.5" strokeDasharray="3 2" />
        <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="central"
          fill="#2980b9" fontSize={suitSize} fontWeight="bold">♠</text>
      </svg>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="drop-shadow-md"
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <rect x="1" y="1" width={w - 2} height={h - 2} rx="6" ry="6"
        fill="#ffffff" stroke="#d0d0d0" strokeWidth="1" />
      {/* Top-left rank */}
      <text x={5} y={fontSize + 3} fill={color} fontSize={fontSize} fontWeight="bold"
        fontFamily="system-ui, sans-serif">{card.rank}</text>
      {/* Center suit */}
      <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={suitSize * 1.6} fontFamily="system-ui, sans-serif">{symbol}</text>
      {/* Bottom-right rank (mirrored from top-left) */}
      <g transform={`rotate(180 ${w / 2} ${h / 2})`}>
        <text x={5} y={fontSize + 3} fill={color} fontSize={fontSize} fontWeight="bold"
          fontFamily="system-ui, sans-serif">{card.rank}</text>
      </g>
    </svg>
  );
}
