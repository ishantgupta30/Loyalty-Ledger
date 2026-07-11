import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { tierIndexForStreak } from "../data/teams";
import idl from "../idl/loyalty_ledger.json";

// After `anchor deploy`, paste the real program id here (same one printed
// by `anchor deploy` and set in Anchor.toml / declare_id!).
export const PROGRAM_ID = new PublicKey(idl.address);

export function getProgram(connection, wallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl, provider);
}

export function findFandomRecordPda(walletPubkey, sport, team) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("fandom"), walletPubkey.toBuffer(), Buffer.from(sport), Buffer.from(team)],
    PROGRAM_ID
  );
  return pda;
}

export function findBadgeMintPda(walletPubkey, sport, team, tier) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("badge-mint"),
      walletPubkey.toBuffer(),
      Buffer.from(sport),
      Buffer.from(team),
      Buffer.from([tier]),
    ],
    PROGRAM_ID
  );
  return pda;
}

// Sends the real on-chain check-in instruction. The PDA it touches is the
// single source of truth for streak_count — nothing about the streak
// itself is trusted from the frontend after this call.
export async function checkInOnChain({ connection, wallet, sport, team }) {
  const program = getProgram(connection, wallet);
  const recordPda = findFandomRecordPda(wallet.publicKey, sport, team);

  const signature = await program.methods
    .checkIn(sport, team)
    .accounts({
      fan: wallet.publicKey,
      fandomRecord: recordPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const record = await program.account.fandomRecord.fetch(recordPda);

  return {
    signature,
    recordPda,
    streakCount: record.streakCount,
    lastCheckinTs: new BN(record.lastCheckinTs).toNumber() * 1000, // seconds -> ms
    highestTierClaimed: record.highestTierClaimed,
  };
}

// Reads the current on-chain record without sending a transaction. Returns
// null if the fan hasn't checked in to this (sport, team) yet — the PDA
// won't exist until the first check_in call creates it.
export async function fetchFandomRecordOnChain({ connection, wallet, sport, team }) {
  if (!wallet?.publicKey) return null;
  const program = getProgram(connection, wallet);
  const recordPda = findFandomRecordPda(wallet.publicKey, sport, team);

  try {
    const record = await program.account.fandomRecord.fetch(recordPda);
    return {
      recordPda,
      streakCount: record.streakCount,
      lastCheckinTs: new BN(record.lastCheckinTs).toNumber() * 1000,
      highestTierClaimed: record.highestTierClaimed,
    };
  } catch {
    // Account doesn't exist yet — no check-in has happened for this pair.
    return null;
  }
}

// Reads every fandom_record PDA on-chain and ranks the ones matching this
// (sport, team) by streak. This only works because sport/team are stored on
// the account itself (not just baked into the PDA seeds) — see the comment
// on FandomRecord in lib.rs. Requires the program to be rebuilt/redeployed
// with that field added; older deployed accounts without it won't appear.
export async function fetchLeaderboardOnChain({ connection, wallet, sport, team, limit = 10 }) {
  const program = getProgram(connection, wallet);
  const all = await program.account.fandomRecord.all();

  return all
    .map(({ account }) => ({
      wallet: account.wallet.toBase58(),
      sport: account.sport,
      team: account.team,
      streakCount: account.streakCount,
      highestTierClaimed: account.highestTierClaimed,
    }))
    .filter((r) => r.sport === sport && r.team === team)
    .sort((a, b) => b.streakCount - a.streakCount)
    .slice(0, limit);
}

// Real transaction history for this fan's PDA — every signature here is an
// actual on-chain transaction that touched this account (check_in or
// claim_badge), pulled straight from the ledger. Not a fabricated log.
export async function fetchRecentActivityOnChain({ connection, wallet, sport, team, limit = 5 }) {
  if (!wallet?.publicKey) return [];
  const recordPda = findFandomRecordPda(wallet.publicKey, sport, team);

  try {
    const signatures = await connection.getSignaturesForAddress(recordPda, { limit });
    return signatures.map((s) => ({
      signature: s.signature,
      timestamp: s.blockTime ? s.blockTime * 1000 : null,
    }));
  } catch {
    return [];
  }
}

// Mints the real, 1-supply badge token for the fan's current tier. Only
// callable once per tier — the program enforces this via the badge mint's
// own PDA seeds, not just the highest_tier_claimed field, so it can't be
// bypassed by a buggy or malicious client.
export async function claimBadgeOnChain({ connection, wallet, sport, team, streakCount }) {
  const tier = tierIndexForStreak(streakCount);
  if (tier === 0) {
    throw new Error("No badge tier reached yet");
  }

  const program = getProgram(connection, wallet);
  const recordPda = findFandomRecordPda(wallet.publicKey, sport, team);
  const badgeMintPda = findBadgeMintPda(wallet.publicKey, sport, team, tier);
  const fanBadgeAccount = getAssociatedTokenAddressSync(badgeMintPda, wallet.publicKey);

  const signature = await program.methods
    .claimBadge(sport, team)
    .accounts({
      fan: wallet.publicKey,
      fandomRecord: recordPda,
      badgeMint: badgeMintPda,
      fanBadgeAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return { signature, tier, mint: badgeMintPda.toBase58() };
}
