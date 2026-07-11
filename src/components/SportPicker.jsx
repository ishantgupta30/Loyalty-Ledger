import { SPORTS } from "../data/teams";

export default function SportPicker({ sport, setSport, team, setTeam, fansCount }) {
  const activeSport = SPORTS.find((s) => s.id === sport);

  return (
    <div>
      <p className="section-eyebrow">01 — Pick your fandom</p>
      <div className="sport-tabs">
        {SPORTS.map((s) => (
          <button
            key={s.id}
            className={`sport-tab ${sport === s.id ? "active" : ""}`}
            onClick={() => {
              setSport(s.id);
              setTeam(s.teams[0]);
            }}
          >
            <span className="sport-tab-label">
              {s.emoji} {s.label}
            </span>
            <span className={`sport-tab-status ${s.live ? "live" : ""}`}>
              {s.live ? "● Live" : "○ Sample data"}
            </span>
          </button>
        ))}
      </div>

      <select
        className="team-select"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
      >
        {activeSport.teams.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {activeSport.live && typeof fansCount === "number" && (
        <p className="fan-count-note">
          {fansCount} fan{fansCount === 1 ? "" : "s"} {fansCount === 1 ? "has" : "have"} checked in for {team}
        </p>
      )}

      {!activeSport.live && (
        <p className="stub-note">
          {activeSport.label} uses sample fixtures, not a live sports feed.
          The check-in button below still runs the same UI flow, but it
          won't send a real devnet transaction — see "What's next" at the
          bottom of the page.
        </p>
      )}
    </div>
  );
}
