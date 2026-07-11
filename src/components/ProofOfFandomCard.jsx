import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { badgeFor } from "../lib/records";

export default function ProofOfFandomCard({ record, sportLabel, walletShort }) {
  const cardRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const tier = badgeFor(record);

  async function handleDownload() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#0b1e2d",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `proof-of-fandom-${record.team.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const lastCheckin = record.lastCheckinTs
    ? new Date(record.lastCheckinTs).toLocaleDateString()
    : "—";

  const provenance = record.onChain
    ? "Streak stored on-chain (PDA)"
    : `${record.checkins?.length ?? 0} on-record (sample data)`;

  return (
    <div>
      <p className="section-eyebrow">03 — Your Proof of Fandom</p>
      <div className="ticket" ref={cardRef}>
        <div className="ticket-main">
          <p className="ticket-eyebrow">{sportLabel}</p>
          <h3 className="ticket-team">{record.team}</h3>
          <span className="ticket-badge">{tier.name}</span>
          <p className="ticket-meta">
            Wallet {walletShort} · Last check-in {lastCheckin} · {provenance}
          </p>
        </div>
        <div className="ticket-stub">
          <span className="streak-number">{record.streakCount}</span>
          <span className="streak-label">Streak</span>
        </div>
      </div>

      <div className="share-row">
        <button className="share-btn" onClick={handleDownload} disabled={saving}>
          {saving ? "Saving…" : "Download as image"}
        </button>
      </div>
    </div>
  );
}
