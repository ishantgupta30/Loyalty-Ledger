import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import SportPicker from "./components/SportPicker";
import CheckInPanel from "./components/CheckInPanel";
import ProofOfFandomCard from "./components/ProofOfFandomCard";
import BadgeClaim from "./components/BadgeClaim";
import FanPassport from "./components/FanPassport";
import Leaderboard from "./components/Leaderboard";
import UpcomingMatch from "./components/UpcomingMatch";
import RecentActivity from "./components/RecentActivity";
import DemoModeToggle from "./components/DemoModeToggle";
import { SPORTS } from "./data/teams";
import { getRecord } from "./lib/records";
import {
  fetchFandomRecordOnChain,
  fetchLeaderboardOnChain,
  fetchRecentActivityOnChain,
} from "./lib/onchainRecords";
import { DEMO_RECORD, DEMO_RANK, DEMO_ACTIVITY } from "./lib/demoMode";

export default function App() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [sport, setSport] = useState(SPORTS[0].id);
  const [team, setTeam] = useState(SPORTS[0].teams[0]);
  const [record, setRecord] = useState(null);
  const [rank, setRank] = useState(null);
  const [fansCount, setFansCount] = useState(null);
  const [activity, setActivity] = useState([]);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  const activeSport = SPORTS.find((s) => s.id === sport);
  const walletStr = publicKey?.toBase58();
  const walletShort = walletStr ? `${walletStr.slice(0, 4)}…${walletStr.slice(-4)}` : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!publicKey) {
        setRecord(null);
        setRank(null);
        setFansCount(null);
        setActivity([]);
        return;
      }

      if (activeSport.live) {
        const onChain = await fetchFandomRecordOnChain({ connection, wallet, sport, team });
        if (!cancelled) {
          setRecord(
            onChain
              ? {
                  sport,
                  team,
                  streakCount: onChain.streakCount,
                  lastCheckinTs: onChain.lastCheckinTs,
                  highestTierClaimed: onChain.highestTierClaimed,
                  onChain: true,
                }
              : { sport, team, streakCount: 0, lastCheckinTs: null, highestTierClaimed: 0, onChain: true }
          );
        }

        try {
          const board = await fetchLeaderboardOnChain({ connection, wallet, sport, team });
          if (!cancelled) {
            const idx = board.findIndex((r) => r.wallet === walletStr);
            setRank(idx >= 0 ? idx + 1 : null);
            setFansCount(board.length);
          }
        } catch {
          if (!cancelled) {
            setRank(null);
            setFansCount(null);
          }
        }

        try {
          const recent = await fetchRecentActivityOnChain({ connection, wallet, sport, team });
          if (!cancelled) {
            setActivity(recent.map((r) => ({ ...r, label: `${team} check-in` })));
          }
        } catch {
          if (!cancelled) setActivity([]);
        }
      } else {
        const localRecord = getRecord(walletStr, sport, team);
        setRecord(localRecord);
        setRank(null);
        setFansCount(null);
        setActivity(
          [...localRecord.checkins]
            .reverse()
            .slice(0, 5)
            .map((c) => ({ ...c, label: `${team} check-in` }))
        );
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletStr, sport, team, activeSport.live, leaderboardRefresh]);

  const displayRecord = demoMode ? DEMO_RECORD : record;
  const displayRank = demoMode ? DEMO_RANK : rank;
  const displayActivity = demoMode ? DEMO_ACTIVITY : activity;

  return (
    <div className="app-shell">
      <header className="scoreboard">
        <div>
          <h1 className="scoreboard-title">
            Loyalty <span>Ledger</span>
          </h1>
          <p className="scoreboard-tagline">Own your fandom forever</p>
        </div>
        <div className="header-actions">
          <DemoModeToggle demoMode={demoMode} setDemoMode={setDemoMode} />
          <WalletMultiButton className="wallet-btn" />
        </div>
      </header>

      {publicKey && displayRecord && (
        <section className="section">
          <FanPassport
            record={displayRecord}
            team={team}
            sportLabel={activeSport.label}
            walletShort={walletShort}
            wallet={walletStr}
            rank={displayRank}
          />
        </section>
      )}

      <section className="section">
        <UpcomingMatch sport={sport} team={team} />
      </section>

      <section className="section">
        <SportPicker
          sport={sport}
          setSport={setSport}
          team={team}
          setTeam={setTeam}
          fansCount={fansCount}
        />
      </section>

      <section className="section">
        <p className="section-eyebrow">02 — Check in to the match</p>
        <CheckInPanel
          sport={sport}
          team={team}
          live={activeSport.live}
          previousStreak={record?.streakCount ?? 0}
          onCheckin={(updated) => {
            setRecord(updated);
            setLeaderboardRefresh((n) => n + 1);
          }}
        />
      </section>

      {publicKey && displayRecord && displayRecord.streakCount > 0 && (
        <section className="section">
          <ProofOfFandomCard
            record={displayRecord}
            sportLabel={activeSport.label}
            walletShort={walletShort}
          />
          <BadgeClaim
            sport={sport}
            team={team}
            record={record}
            onClaimed={(tier) =>
              setRecord((prev) => (prev ? { ...prev, highestTierClaimed: tier } : prev))
            }
          />
        </section>
      )}

      <section className="section">
        <p className="section-eyebrow">Recent Activity</p>
        <RecentActivity items={displayActivity} live={activeSport.live && !demoMode} />
      </section>

      <section className="section">
        <p className="section-eyebrow">Leaderboard — {team}</p>
        <Leaderboard sport={sport} team={team} live={activeSport.live} refreshKey={leaderboardRefresh} />
      </section>

      <p className="footer-note">
        Every check-in becomes permanent proof that you supported your team —
        a record that belongs to your wallet, not to this app. Technically:
        every check-in for FIFA World Cup teams calls a real Anchor program
        on Solana devnet — no real funds, just a cheap, instant, wallet-signed
        instruction that creates or updates a program-owned account (a PDA)
        keyed to your wallet, the sport, and the team. That account is the
        one and only place the streak count lives; nothing about it is
        computed or trusted from this frontend. NBA and Other International
        Sport currently reuse the same UI with sample fixtures instead of a
        live sports feed or a real on-chain write — see the README for the
        exact program source and deploy steps.
      </p>
    </div>
  );
}
