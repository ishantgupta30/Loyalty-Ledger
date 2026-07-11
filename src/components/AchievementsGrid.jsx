import { achievementsFor } from "../lib/achievements";

export default function AchievementsGrid({ streak }) {
  const achievements = achievementsFor(streak);

  return (
    <div className="achievements-grid">
      {achievements.map((a) => (
        <div key={a.id} className={`achievement-chip ${a.unlocked ? "unlocked" : "locked"}`}>
          <span className="achievement-icon">{a.unlocked ? a.icon : "🔒"}</span>
          <span className="achievement-label">{a.label}</span>
        </div>
      ))}
    </div>
  );
}
