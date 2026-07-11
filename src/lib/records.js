import { tierForStreak } from "../data/teams";

// Mirrors the on-chain PDA key design from the spec: (wallet, sport, team).
// The PDA itself would only need to hold { streakCount, lastCheckinTs } —
// here we keep that same shape locally, plus the richer check-in history
// (event id + tx signature) that the spec says can live off-chain.

const STORAGE_KEY = "loyalty-ledger:records:v1";

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function recordKey(wallet, sport, team) {
  return `${wallet}:${sport}:${team}`;
}

export function getRecord(wallet, sport, team) {
  if (!wallet || !team) return null;
  const all = loadAll();
  const key = recordKey(wallet, sport, team);
  return (
    all[key] || {
      sport,
      team,
      checkins: [],
      streakCount: 0,
      lastCheckinTs: null,
    }
  );
}

// A new check-in extends the streak if the last check-in was within the
// last 10 days (loose stand-in for "one check-in per matchday/week" during
// a weekend demo — swap for real fixture-date logic once a live sports API
// is wired in, see README).
const STREAK_WINDOW_MS = 10 * 24 * 60 * 60 * 1000;

export function applyCheckin(wallet, sport, team, { eventId, txSignature }) {
  const all = loadAll();
  const key = recordKey(wallet, sport, team);
  const existing = getRecord(wallet, sport, team);

  const now = Date.now();
  const withinWindow =
    existing.lastCheckinTs && now - existing.lastCheckinTs <= STREAK_WINDOW_MS;

  const updated = {
    ...existing,
    streakCount: withinWindow ? existing.streakCount + 1 : 1,
    lastCheckinTs: now,
    checkins: [
      ...existing.checkins,
      { eventId, timestamp: now, txSignature },
    ],
  };

  all[key] = updated;
  saveAll(all);
  return updated;
}

export function badgeFor(record) {
  return tierForStreak(record?.streakCount ?? 0);
}
