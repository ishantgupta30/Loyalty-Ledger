import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { checkInOnChain } from "../lib/onchainRecords";
import { mockCheckinTransaction } from "../lib/checkin";
import { applyCheckin } from "../lib/records";
import { fanScore } from "../lib/fanScore";
import { tierForStreak } from "../data/teams";
import ConfettiBurst from "./ConfettiBurst";

export default function CheckInPanel({ sport, team, live, previousStreak = 0, onCheckin }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [status, setStatus] = useState(null); // null | "pending" | { signature } | { error }
  const [reward, setReward] = useState(null); // { scoreGain, badgeUnlocked } | null
  const [confettiKey, setConfettiKey] = useState(null);

  function celebrate(newStreak) {
    const before = tierForStreak(previousStreak);
    const after = tierForStreak(newStreak);
    const scoreBefore = fanScore({ streakCount: previousStreak });
    const scoreAfter = fanScore({ streakCount: newStreak });

    setReward({
      scoreGain: scoreAfter - scoreBefore,
      badgeUnlocked: after.name !== before.name ? after.name : null,
    });
    setConfettiKey(Date.now());
  }

  async function handleCheckIn() {
    if (!publicKey) return;
    setStatus("pending");
    setReward(null);
    try {
      if (live) {
        // Real on-chain path: the check_in instruction creates/updates a
        // PDA owned by the program, so the streak it returns is not
        // something the frontend could have faked.
        const { signature, streakCount, lastCheckinTs, highestTierClaimed } = await checkInOnChain({
          connection,
          wallet,
          sport,
          team,
        });

        setStatus({ signature });
        celebrate(streakCount);
        onCheckin({
          sport,
          team,
          streakCount,
          lastCheckinTs,
          highestTierClaimed,
          onChain: true,
        });
      } else {
        // Stubbed sports: same UI, no network call, no on-chain truth.
        const signature = await mockCheckinTransaction();
        const eventId = `${sport}-${team}-${new Date().toISOString().slice(0, 10)}`;
        const updated = applyCheckin(publicKey.toBase58(), sport, team, {
          eventId,
          txSignature: signature,
        });

        setStatus({ signature });
        celebrate(updated.streakCount);
        onCheckin({ ...updated, onChain: false });
      }
    } catch (err) {
      console.error(err);
      setStatus({ error: err.message || "Transaction failed" });
    }
  }

  if (!publicKey) {
    return (
      <div className="checkin-panel">
        <p className="connect-hint">Connect your wallet to check in.</p>
      </div>
    );
  }

  return (
    <div className="checkin-panel">
      <ConfettiBurst triggerKey={confettiKey} />

      <button
        className={`checkin-btn ${reward ? "just-checked-in" : ""}`}
        disabled={status === "pending"}
        onClick={handleCheckIn}
      >
        {status === "pending"
          ? "Confirming on devnet…"
          : `Check In to ${team}`}
      </button>

      {reward && (
        <div className="reward-toast">
          <span className="reward-line">🔥 Streak extended · +{reward.scoreGain} Fan Score</span>
          {reward.badgeUnlocked && (
            <span className="reward-line reward-badge">
              🏆 {reward.badgeUnlocked} unlocked
            </span>
          )}
        </div>
      )}

      {status && status !== "pending" && status.signature && (
        <p className="checkin-status">
          {live ? (
            <>
              ✓ Permanent proof, written on-chain —{" "}
              <a
                href={`https://explorer.solana.com/tx/${status.signature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                view transaction
              </a>
            </>
          ) : (
            <>✓ Stubbed check-in recorded (sample signature {status.signature})</>
          )}
        </p>
      )}

      {status && status.error && (
        <p className="checkin-status">✗ {status.error}</p>
      )}
    </div>
  );
}
