# Loyalty Ledger — Proof of Fandom

A multi-sport fan loyalty tracker. Fans check in during real matches, and each
check-in is recorded as a cheap, instant transaction on Solana — building a
portable, tamper-proof streak/badge history tied to a wallet instead of any
single app or platform.

## What's actually working vs. stubbed (read this first)

| Sport | Status |
|---|---|
| **FIFA World Cup** | Fully working, and fully on-chain. "Check In" calls a real Anchor program on Solana **devnet** — it creates or updates a PDA (program-owned account) keyed to `(wallet, sport, team)` that holds `streak_count` and `last_checkin_ts`. That account, not the frontend, is the source of truth for your streak. |
| **NBA** | Same UI/flow, sample fixtures. "Check In" resolves with a mock signature after a short delay — no network call, no on-chain write. |
| **Other International Sport** | Same as NBA — stubbed. |

The Anchor program source is in `anchor/programs/loyalty_ledger/src/lib.rs`.
**It needs to be built and deployed before the World Cup path will work** —
see `anchor/README.md` for the exact commands. Until you do that, the
frontend is pointed at a placeholder program id and check-ins for World Cup
teams will fail with an account-not-found error, which is expected.

No real funds are involved anywhere — devnet only.

## Badge tiers

| Streak | Tier |
|---|---|
| 0+ | Rookie Fan |
| 3+ | Devoted Fan |
| 7+ | Veteran Fan |
| 15+ | Legend |

## Running it

```bash
npm install
npm run dev
```

You'll need:
- [Phantom wallet](https://phantom.app/) browser extension, switched to **Devnet** (Settings → Developer Settings → Change Network → Devnet).
- Some devnet SOL for transaction fees — get free devnet SOL from the
  [Solana faucet](https://faucet.solana.com/) using your Phantom address.

Then open the app, connect your wallet, pick World Cup + a team, and hit
"Check In." You'll see a loading state, then a link to the transaction on
Solana Explorer (devnet cluster).

## Project structure

```
src/
  WalletContextProvider.jsx   # Phantom + devnet connection setup
  data/teams.js                # sport/team data model + badge tier thresholds
  lib/checkin.js                # real devnet memo tx (World Cup) / mock tx (stubs)
  lib/records.js                # local FandomRecord storage + streak logic
  components/SportPicker.jsx    # sport tabs + team select, honest stub notice
  components/CheckInPanel.jsx    # check-in button + tx status/explorer link
  components/ProofOfFandomCard.jsx  # ticket-stub "Proof of Fandom" + PNG export
  App.jsx
```

## Why Solana

Loyalty check-ins are frequent and individually low-value — potentially one
per match, per fan, across millions of fans. That only works economically and
in real time if each transaction is near-free and near-instant. That's the
actual reason Solana is load-bearing here: the memo transaction sent on every
World Cup check-in is a real, wallet-signed, timestamped receipt that costs a
fraction of a cent and confirms in about a second, which is what makes
"check in to every match" a plausible product instead of a novelty.

## What's next / limitations

- **Live sports data**: sport/team selection and event IDs are currently
  manual. The next step is wiring in a real sports API (fixtures, live match
  IDs) so check-ins are tied to an actual scheduled event instead of a
  same-day string.
- **On-chain PDA**: replace the local streak calculation with a small Anchor
  program that owns a PDA per `(wallet, sport, team)` storing `streakCount`
  and `lastCheckinTs` on-chain, so the streak itself — not just the
  transaction log — is verifiable by anyone without trusting this frontend.
- **Badge NFTs**: mint a badge NFT at each tier milestone instead of a UI-only
  badge, so "Legend" status is itself a holdable, tradeable, verifiable asset.
- **NBA / Other sports**: swap sample fixtures for a real feed once the World
  Cup flow above is proven out.

---

## Submission post draft

Use this as a starting point for the actual contest submission (fill in the
demo GIF/video and Explorer link once you've recorded a run):

> **Two fans, same club, wildly different history. Right now, there's no way
> to tell them apart.**
>
> Loyalty Ledger turns "I've been a fan forever" into something provable.
> Fans check in during real matches — right now, the World Cup — and each
> check-in is a cheap, instant, wallet-signed transaction on Solana devnet.
> Over time that builds a portable "Proof of Fandom": a streak and badge
> history tied to the fan's wallet, not to any single app.
>
> **[demo GIF/video here — connect wallet → pick team → check in → streak
> updates → download Proof of Fandom card]**
>
> **How it works:** connect wallet → pick a sport/team → check in (sends a
> real devnet memo transaction, confirmed and linked on Solana Explorer:
> **[explorer link here]**) → streak and badge tier update → download a
> shareable Proof of Fandom card.
>
> **Why Solana:** frequent, low-value check-ins — potentially every match,
> every fan, at scale — only work if transactions are near-free and
> near-instant. That's not decorative here; it's the entire reason the
> product is possible at all.
>
> **What's next:** NBA and other sports currently reuse the same on-chain
> flow with sample fixtures instead of live data — swapping in a real sports
> API is the next step, along with moving the streak itself on-chain via a
> small Anchor PDA program.
