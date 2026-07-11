import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { fetchLeaderboardOnChain } from "../lib/onchainRecords";

export default function Leaderboard({ sport, team, live, refreshKey }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [rows, setRows] = useState(null); // null = loading/not attempted
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!publicKey || !live) {
        setRows(null);
        return;
      }
      setError(null);
      try {
        const data = await fetchLeaderboardOnChain({ connection, wallet, sport, team });
        if (!cancelled) setRows(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err.message || "Couldn't load leaderboard");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, sport, team, live, refreshKey]);

  if (!live) {
    return (
      <p className="stub-note">
        Leaderboards are only available for FIFA World Cup right now — NBA
        and Other International Sport are stubbed and have no on-chain data
        to rank.
      </p>
    );
  }

  if (!publicKey) {
    return <p className="connect-hint">Connect your wallet to see the leaderboard.</p>;
  }

  if (error) {
    return <p className="checkin-status">✗ {error}</p>;
  }

  const myWallet = publicKey.toBase58();

  return (
    <div className="leaderboard">
      {rows === null ? (
        <p className="connect-hint">Loading leaderboard…</p>
      ) : rows.length === 0 ? (
        <p className="connect-hint">No check-ins for {team} yet — be the first.</p>
      ) : (
        <ol className="leaderboard-list">
          {rows.map((r, i) => (
            <li
              key={r.wallet}
              className={`leaderboard-row ${r.wallet === myWallet ? "me" : ""}`}
            >
              <span className="leaderboard-rank">#{i + 1}</span>
              <span className="leaderboard-wallet">
                {r.wallet === myWallet
                  ? "You"
                  : `${r.wallet.slice(0, 4)}…${r.wallet.slice(-4)}`}
              </span>
              <span className="leaderboard-streak">{r.streakCount}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
