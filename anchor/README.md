# Loyalty Ledger — on-chain program

This is the real on-chain piece: an Anchor program that owns a PDA per
`(wallet, sport, team)` holding `streak_count` and `last_checkin_ts`. The
frontend calls `check_in` on this program directly for the World Cup path —
the streak is not computed or trusted client-side.

I can't build, deploy, or test this from the environment I wrote it in (no
Rust/Solana/Anchor toolchain, no route to devnet's RPC), so **you need to run
these steps yourself.** They're the real, standard Anchor workflow — nothing
shortcut-y about them.

## 1. Install the toolchain (one-time)

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor version manager + Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest
```

Confirm they're all on PATH:
```bash
rustc --version
solana --version
anchor --version
```

## 2. Point the Solana CLI at devnet and fund a deploy wallet

```bash
solana config set --url devnet
solana-keygen new -o ~/.config/solana/id.json   # only if you don't have one yet
solana airdrop 2
```

This is a **separate** wallet from your Phantom browser wallet — it's the
keypair Anchor uses to deploy the program (pay rent, upload the binary).
The 2 devnet SOL here is just for that.

## 3. Build once to generate your program's real keypair

```bash
cd anchor
anchor build
anchor keys list
```

`anchor keys list` prints a program id that was randomly generated for you
just now — it will **not** match the placeholder id already in this repo.
Copy it.

## 4. Put the real program id in both places that need it

- `anchor/programs/loyalty_ledger/src/lib.rs` → update `declare_id!("...")`
- `anchor/Anchor.toml` → update `loyalty_ledger = "..."` under `[programs.devnet]`

Then rebuild so the binary embeds the correct id:

```bash
anchor build
```

## 5. Deploy to devnet

```bash
anchor deploy --provider.cluster devnet
```

This prints the deployed program id again (should match what you just set)
and a transaction signature — that's your on-chain proof the program exists.

## 6. (Optional but recommended) run the tests

```bash
anchor test --provider.cluster devnet --skip-local-validator
```

This exercises `check_in` end-to-end against devnet: creates a record,
increments the streak, and checks that different teams get different PDAs.

## 7. Wire the frontend to your deployed program

Two files in the frontend need the real values from your deploy:

1. Copy `anchor/target/idl/loyalty_ledger.json` over
   `../src/idl/loyalty_ledger.json` (replacing the placeholder there).
2. Nothing else needs manual editing — `src/lib/onchainRecords.js` reads the
   program id straight out of that IDL file's `address` field.

Restart the frontend dev server (`npm run dev` from the repo root) and the
"Check In" button for World Cup teams will now call your real deployed
program instead of doing nothing useful with a placeholder id.

## What this buys you over the earlier version

Before this, "streak count" lived in the browser's `localStorage` — anyone
could open dev tools and set it to anything. Now it lives in a PDA the
program itself owns and updates; the only way to change it is to actually
sign and send a `check_in` instruction. That's the difference between
"an app that logs to Solana" and "an app whose core state *is* on Solana."

## Badge minting (`claim_badge`)

Once a fan's on-chain streak crosses a tier threshold (3 / 7 / 15 — Devoted /
Veteran / Legend), they can call `claim_badge` to mint a real, 1-supply SPL
token straight to their wallet. It's a plain token, not a full Metaplex NFT
with image/name metadata — that's a deliberate scope cut, documented as the
next step rather than faked. What it does give you is real: a token that
genuinely cannot be duplicated (the mint's own PDA seeds are
`wallet + sport + team + tier`, so `init` simply fails if that tier was
already claimed — this isn't just an app-level check, it's enforced by the
account system itself), and that anyone can verify by checking whether a
wallet holds it, with no trust in this frontend required.
