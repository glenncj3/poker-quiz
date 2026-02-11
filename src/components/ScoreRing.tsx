interface ScoreRingProps {
  correct: number;
  total: number;
  size?: number;
}

export function ScoreRing({ correct, total, size = 160 }: ScoreRingProps) {
  const pct = total > 0 ? correct / total : 0;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  let color = '#e74c3c'; // red
  if (pct >= 0.8) color = '#27ae60'; // green
  else if (pct >= 0.5) color = '#d4af37'; // gold

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
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
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-bold" style={{ color }}>{correct}</span>
        <span className="text-sm text-gray-400">of {total}</span>
      </div>
    </div>
  );
}
