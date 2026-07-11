// Sport + team data model.
// "fifa_world_cup" is the fully working demo path (real devnet transactions).
// "nba" and "other" are stubbed with the same UI/flow but static sample fixtures,
// per the weekend-scope decision documented in the README.

export const SPORTS = [
  {
    id: "fifa_world_cup",
    label: "FIFA World Cup",
    emoji: "⚽",
    live: true,
    teams: [
      "Argentina",
      "France",
      "Brazil",
      "England",
      "Spain",
      "Germany",
      "Portugal",
      "Netherlands",
      "Morocco",
      "Japan",
    ],
  },
  {
    id: "nba",
    label: "NBA",
    emoji: "🏀",
    live: false,
    teams: [
      "Boston Celtics",
      "Denver Nuggets",
      "LA Lakers",
      "Golden State Warriors",
      "New York Knicks",
    ],
  },
  {
    id: "other",
    label: "Other International Sport",
    emoji: "🏆",
    live: false,
    teams: ["India Cricket", "All Blacks Rugby", "Team USA Athletics"],
  },
];

export const BADGE_TIERS = [
  { name: "Rookie Fan", minStreak: 0 },
  { name: "Devoted Fan", minStreak: 3 },
  { name: "Veteran Fan", minStreak: 7 },
  { name: "Legend", minStreak: 15 },
];

export function tierForStreak(streak) {
  let current = BADGE_TIERS[0];
  for (const tier of BADGE_TIERS) {
    if (streak >= tier.minStreak) current = tier;
  }
  return current;
}

// Mirrors the on-chain program's tier_for_streak exactly (see
// anchor/programs/loyalty_ledger/src/lib.rs). Tier 0 = Rookie Fan = no
// badge to claim. Tiers 1-3 = Devoted / Veteran / Legend, each mintable
// once via claim_badge.
export function tierIndexForStreak(streak) {
  let tier = 0;
  const thresholds = BADGE_TIERS.slice(1).map((t) => t.minStreak); // [3, 7, 15]
  thresholds.forEach((threshold, i) => {
    if (streak >= threshold) tier = i + 1;
  });
  return tier;
}
