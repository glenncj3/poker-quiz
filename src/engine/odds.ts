export interface PotOdds {
  ratio: string;
  percentage: number;
}

/**
 * Calculate pot odds given the current pot size and the bet to call.
 */
export function calculatePotOdds(potSize: number, betSize: number): PotOdds {
  const totalPot = potSize + betSize;
  const percentage = (betSize / totalPot) * 100;
  const ratio = `${(totalPot / betSize).toFixed(1)}:1`;

  return { ratio, percentage: Math.round(percentage * 10) / 10 };
}
