// Purely presentational — used only when the person recording a demo
// toggles it on. It never writes to localStorage or the chain, and it's
// visibly labeled "Demo Preview" wherever it's shown so a judge (or you,
// six months from now) can't mistake it for a real account.
export const DEMO_RECORD = {
  streakCount: 47,
  lastCheckinTs: Date.now() - 1000 * 60 * 60 * 20, // ~20h ago
  highestTierClaimed: 2, // Veteran Fan claimed
  onChain: true,
  demo: true,
};

export const DEMO_RANK = 3;

export const DEMO_ACTIVITY = [
  { label: "Argentina vs Brazil", timestamp: Date.now() - 1000 * 60 * 60 * 20 },
  { label: "Argentina vs France", timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 },
  { label: "Argentina vs Spain", timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7 },
];
