import { BADGE_TIERS, tierIndexForStreak } from "../data/teams";

// Each achievement is derived purely from data you already have (streak
// count, tier index) — nothing here is invented or stored separately, so
// there's nothing new to keep in sync with the chain.
export const ACHIEVEMENTS = [
  {
    id: "first-checkin",
    icon: "🏅",
    label: "First Check-in",
    isUnlocked: (streak) => streak >= 1,
  },
  {
    id: "devoted",
    icon: "🔥",
    label: "Devoted Fan",
    isUnlocked: (streak) => streak >= BADGE_TIERS[1].minStreak,
  },
  {
    id: "veteran",
    icon: "🎖️",
    label: "Veteran Fan",
    isUnlocked: (streak) => streak >= BADGE_TIERS[2].minStreak,
  },
  {
    id: "legend",
    icon: "🏆",
    label: "Legend",
    isUnlocked: (streak) => streak >= BADGE_TIERS[3].minStreak,
  },
  {
    id: "ten-match-club",
    icon: "🔟",
    label: "10 Match Club",
    isUnlocked: (streak) => streak >= 10,
  },
];

export function achievementsFor(streak) {
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.isUnlocked(streak) }));
}

// Separate from streak-based achievements: whether the fan has actually
// minted the on-chain badge token for a tier (vs. just being eligible to).
// Mirrors highest_tier_claimed from FandomRecord.
export function claimedTierName(highestTierClaimed) {
  if (!highestTierClaimed) return null;
  return BADGE_TIERS[highestTierClaimed]?.name ?? null;
}

export { tierIndexForStreak };
