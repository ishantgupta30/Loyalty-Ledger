import { useEffect, useState } from "react";
import { SPORTS } from "../data/teams";

// No live sports API is wired in (see README "What's next"), so this is a
// deterministic *sample* fixture — same team always gets the same opponent
// and a stable countdown target, rather than a random one that would look
// broken on refresh. It's labeled "Sample fixture" in the UI so it's never
// mistaken for real match data.
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function opponentFor(sport, team) {
  const sportDef = SPORTS.find((s) => s.id === sport);
  const others = sportDef.teams.filter((t) => t !== team);
  if (others.length === 0) return "TBD";
  return others[hashString(team) % others.length];
}

function nextKickoff(team) {
  const dayMs = 24 * 60 * 60 * 1000;
  const offsetHours = 6 + (hashString(team) % 66); // 6h – 72h into the cycle
  const cycleStart = Math.floor(Date.now() / (3 * dayMs)) * (3 * dayMs);
  let target = cycleStart + offsetHours * 60 * 60 * 1000;
  if (target < Date.now()) target += 3 * dayMs;
  return target;
}

function formatCountdown(ms) {
  if (ms <= 0) return "Check-in open now";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function UpcomingMatch({ sport, team }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const opponent = opponentFor(sport, team);
  const kickoff = nextKickoff(team);
  const remaining = kickoff - now;
  const kickoffDate = new Date(kickoff);
  const isToday = kickoffDate.toDateString() === new Date(now).toDateString();

  return (
    <div className="upcoming-match">
      <div className="upcoming-match-head">
        <p className="section-eyebrow">Upcoming Match · Sample fixture</p>
        <span className="upcoming-match-when">{isToday ? "Today" : "Soon"}</span>
      </div>
      <p className="upcoming-match-title">
        {team} vs {opponent}
      </p>
      <p className="upcoming-match-countdown">
        Check-in opens in <span>{formatCountdown(remaining)}</span>
      </p>
    </div>
  );
}
