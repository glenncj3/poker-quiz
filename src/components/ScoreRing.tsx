interface ScoreRingProps {
  correct: number;
  total: number;
  size?: number;
  isStreak?: boolean;
}

export function ScoreRing({ correct, total, size = 160, isStreak }: ScoreRingProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;

  if (isStreak) {
    const streakColor = '#d4af37'; // gold
    return (
      <div className="relative inline-flex items-center justify-center animate-scale-in" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={streakColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-label={`Streak: ${correct}`}>
          <span className="text-3xl font-bold" style={{ color: streakColor }}>{correct}</span>
          <span className="text-sm text-gray-400">streak</span>
        </div>
      </div>
    );
  }

  const pct = total > 0 ? correct / total : 0;
  const offset = circumference * (1 - pct);

  let color = '#e74c3c'; // red
  if (pct >= 0.8) color = '#27ae60'; // green
  else if (pct >= 0.5) color = '#d4af37'; // gold

  return (
    <div className="relative inline-flex items-center justify-center animate-scale-in" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2d2d4a"
          strokeWidth="10"
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-label={`Score: ${correct} of ${total}`}>
        <span className="text-3xl font-bold" style={{ color }}>{correct}</span>
        <span className="text-sm text-gray-400">of {total}</span>
      </div>
    </div>
  );
}
