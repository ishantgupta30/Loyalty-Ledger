// Neither the on-chain FandomRecord nor the local record store a
// "member since" date — the PDA only has streak_count and last_checkin_ts.
// Rather than invent one, we record the first time this wallet is seen by
// THIS browser and treat that as membership start. It's honestly a "first
// seen locally" date, not portable, but the alternative (fabricating an
// on-chain field) isn't better and would be more claim than we can back up.
const STORAGE_KEY = "loyalty-ledger:member-since:v1";

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

export function memberSince(wallet) {
  if (!wallet) return null;
  const all = loadAll();
  if (!all[wallet]) {
    all[wallet] = Date.now();
    saveAll(all);
  }
  return all[wallet];
}

export function memberSinceYear(wallet) {
  const ts = memberSince(wallet);
  return ts ? new Date(ts).getFullYear() : null;
}
