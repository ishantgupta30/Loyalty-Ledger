import { BADGE_TIERS, tierForStreak } from "../data/teams";

// Fan Score is a presentational number derived entirely from data that's
// already on-chain (streak_count) or already computed locally (tier).
// It doesn't need its own account field — nothing here is a claim about
// what's stored on-chain, it's just a friendlier way to show the streak.
export function fanScore(record) {
  if (!record) return 0;
  const tierIndex = tierIndexOf(record.streakCount);
  return record.streakCount * 2 + tierIndex * 15;
}

function tierIndexOf(streak) {
  const current = tierForStreak(streak);
  return BADGE_TIERS.findIndex((t) => t.name === current.name);
}

// Returns { current, next, progress (0-1), remaining } describing how far
// the fan is from the next badge tier, for the progress bar.
export function nextTierProgress(streak) {
  const currentIndex = tierIndexOf(streak);
  const current = BADGE_TIERS[currentIndex];
  const next = BADGE_TIERS[currentIndex + 1];

  if (!next) {
    return { current, next: null, progress: 1, remaining: 0 };
  }

  const span = next.minStreak - current.minStreak;
  const progress = Math.min(1, Math.max(0, (streak - current.minStreak) / span));
  return { current, next, progress, remaining: next.minStreak - streak };
}
