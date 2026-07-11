import { BADGE_TIERS } from "../data/teams";
import { fanScore, nextTierProgress } from "../lib/fanScore";
import { memberSinceYear } from "../lib/memberSince";
import AchievementsGrid from "./AchievementsGrid";

function formatLastCheckin(ts) {
  if (!ts) return "—";
  const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function FanPassport({ record, team, sportLabel, walletShort, wallet, rank }) {
  const streak = record?.streakCount ?? 0;
  const score = fanScore(record);
  const { current, next, progress, remaining } = nextTierProgress(streak);
  const tierIndex = BADGE_TIERS.findIndex((t) => t.name === current.name);
  const since = memberSinceYear(wallet);

  return (
    <div className="fan-passport">
      {record?.demo && <div className="demo-banner">Demo Preview — sample data, not your real account</div>}

      <div className="fan-passport-head">
        <div>
          <p className="section-eyebrow">Your Fan Passport</p>
          <h2 className="fan-passport-name">{walletShort}</h2>
          <p className="fan-passport-sub">
            {team} · {sportLabel}
          </p>
        </div>
        <div className="fan-passport-stars" title={`${current.name} tier`}>
          {BADGE_TIERS.slice(1).map((_, i) => (
            <span key={i} className={i < tierIndex ? "star filled" : "star"}>
              ★
            </span>
          ))}
        </div>
      </div>

      <div className="fan-passport-id-row">
        <div className="fan-id-field">
          <span className="fan-id-label">Member Since</span>
          <span className="fan-id-value">{since ?? "—"}</span>
        </div>
        <div className="fan-id-field">
          <span className="fan-id-label">Favorite Team</span>
          <span className="fan-id-value">{team}</span>
        </div>
        <div className="fan-id-field">
          <span className="fan-id-label">Favorite Sport</span>
          <span className="fan-id-value">{sportLabel}</span>
        </div>
        <div className="fan-id-field">
          <span className="fan-id-label">Last Check-in</span>
          <span className="fan-id-value">{formatLastCheckin(record?.lastCheckinTs)}</span>
        </div>
      </div>

      <div className="fan-passport-stats">
        <div className="fan-stat">
          <span className="fan-stat-value">{score}</span>
          <span className="fan-stat-label">Fan Score</span>
        </div>
        <div className="fan-stat">
          <span className="fan-stat-value">{streak}</span>
          <span className="fan-stat-label">Current Streak</span>
        </div>
        <div className="fan-stat">
          <span className="fan-stat-value">{streak}</span>
          <span className="fan-stat-label">Total Matches</span>
        </div>
        <div className="fan-stat">
          <span className="fan-stat-value">{current.name}</span>
          <span className="fan-stat-label">Tier</span>
        </div>
        {rank && (
          <div className="fan-stat">
            <span className="fan-stat-value">#{rank}</span>
            <span className="fan-stat-label">Rank ({team})</span>
          </div>
        )}
      </div>

      <div className="fan-progress">
        {next ? (
          <>
            <div className="fan-progress-labels">
              <span>{current.name}</span>
              <span>{next.name}</span>
            </div>
            <div className="fan-progress-track">
              <div
                className="fan-progress-fill"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="fan-progress-note">
              {remaining > 0
                ? `${remaining} more check-in${remaining === 1 ? "" : "s"} to ${next.name}`
                : `${next.name} unlocked`}
            </p>
          </>
        ) : (
          <p className="fan-progress-note">Top tier reached — Legend status.</p>
        )}
      </div>

      <div className="fan-achievements">
        <p className="section-eyebrow">Achievements</p>
        <AchievementsGrid streak={streak} />
      </div>

      <p className="fan-passport-explainer">
        Your Fan Passport lives in a Solana program-owned account — it
        belongs to your wallet, not this website, so your history stays with
        you wherever participating apps support it.
      </p>
    </div>
  );
}
