import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { claimBadgeOnChain } from "../lib/onchainRecords";
import { tierIndexForStreak, BADGE_TIERS } from "../data/teams";

export default function BadgeClaim({ sport, team, record, onClaimed }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [status, setStatus] = useState(null); // null | "pending" | { mint, signature } | { error }

  if (!record?.onChain) return null;

  const tier = tierIndexForStreak(record.streakCount);
  const alreadyClaimed = (record.highestTierClaimed ?? 0) >= tier;

  if (tier === 0) return null; // Rookie Fan — nothing to claim yet.

  async function handleClaim() {
    setStatus("pending");
    try {
      const { signature, mint } = await claimBadgeOnChain({
        connection,
        wallet,
        sport,
        team,
        streakCount: record.streakCount,
      });
      setStatus({ signature, mint });
      onClaimed(tier);
    } catch (err) {
      console.error(err);
      setStatus({ error: err.message || "Claim failed" });
    }
  }

  const tierName = BADGE_TIERS[tier].name;

  return (
    <div className="badge-claim">
      {alreadyClaimed ? (
        <p className="badge-claim-note">
          ✓ {tierName} badge already minted to your wallet — check your token
          account on Explorer to see it.
        </p>
      ) : (
        <>
          <button
            className="share-btn"
            onClick={handleClaim}
            disabled={status === "pending"}
          >
            {status === "pending"
              ? "Minting badge…"
              : `Claim ${tierName} badge (mint on-chain)`}
          </button>
          {status && status.signature && (
            <p className="badge-claim-note">
              ✓ Minted —{" "}
              <a
                href={`https://explorer.solana.com/address/${status.mint}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                view token on Explorer
              </a>
            </p>
          )}
          {status && status.error && (
            <p className="badge-claim-note">✗ {status.error}</p>
          )}
        </>
      )}
    </div>
  );
}
