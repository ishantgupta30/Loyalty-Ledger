use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

declare_id!("D6FQhKYEx6jfWUoqLjyEXnMRkwJvE6RHsMs4woDKmLuC");

// A check-in older than this no longer extends the streak — it resets to 1.
// Loose stand-in for "one check-in per matchday" during a weekend build;
// swap for real fixture-date logic once a live sports API is wired in.
const STREAK_WINDOW_SECONDS: i64 = 10 * 24 * 60 * 60;

// Tier thresholds, matching BADGE_TIERS in the frontend (src/data/teams.js).
// Tier 0 (Rookie Fan) has no badge — there's nothing to prove yet.
const TIER_THRESHOLDS: [u32; 3] = [3, 7, 15]; // Devoted, Veteran, Legend

fn tier_for_streak(streak: u32) -> u8 {
    let mut tier = 0u8;
    for (i, threshold) in TIER_THRESHOLDS.iter().enumerate() {
        if streak >= *threshold {
            tier = (i + 1) as u8;
        }
    }
    tier
}

#[program]
pub mod loyalty_ledger {
    use super::*;

    /// Creates the fan's record on first check-in, or extends/resets its
    /// streak on every check-in after that. The PDA is the single source
    /// of truth for streak_count — nothing about it lives in the frontend.
    pub fn check_in(ctx: Context<CheckIn>, sport: String, team: String) -> Result<()> {
        require!(sport.len() <= 32, LoyaltyError::SportTooLong);
        require!(team.len() <= 32, LoyaltyError::TeamTooLong);

        let record = &mut ctx.accounts.fandom_record;
        let now = Clock::get()?.unix_timestamp;

        if record.last_checkin_ts == 0 {
            record.wallet = ctx.accounts.fan.key();
            record.streak_count = 1;
            record.sport = sport.clone();
            record.team = team.clone();
        } else if now - record.last_checkin_ts <= STREAK_WINDOW_SECONDS {
            record.streak_count = record
                .streak_count
                .checked_add(1)
                .ok_or(LoyaltyError::Overflow)?;
        } else {
            record.streak_count = 1;
        }

        record.last_checkin_ts = now;
        record.bump = ctx.bumps.fandom_record;

        emit!(CheckInEvent {
            wallet: record.wallet,
            sport,
            team,
            streak_count: record.streak_count,
            timestamp: now,
        });

        Ok(())
    }

    /// Mints a real, 1-supply on-chain token the first time a fan reaches a
    /// new badge tier. This is deliberately a plain SPL token (no image or
    /// name attached) rather than a full Metaplex NFT — a fan-holds-1-token
    /// check is genuinely unfakeable and verifiable by anyone, and adding
    /// rich metadata is documented as the next step rather than faked here.
    /// Each (wallet, sport, team, tier) can only ever mint once, enforced by
    /// the PDA seeds on `badge_mint` itself, not just the `highest_tier_claimed`
    /// field — so even a buggy client can't double-claim the same tier.
    pub fn claim_badge(ctx: Context<ClaimBadge>, sport: String, team: String) -> Result<()> {
        let record = &ctx.accounts.fandom_record;
        let tier = tier_for_streak(record.streak_count);

        require!(tier > 0, LoyaltyError::NoTierReached);
        require!(
            tier > record.highest_tier_claimed,
            LoyaltyError::TierAlreadyClaimed
        );

        let fan_key = ctx.accounts.fan.key();
        let signer_seeds: &[&[u8]] = &[
            b"fandom",
            fan_key.as_ref(),
            sport.as_bytes(),
            team.as_bytes(),
            &[record.bump],
        ];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                MintTo {
                    mint: ctx.accounts.badge_mint.to_account_info(),
                    to: ctx.accounts.fan_badge_account.to_account_info(),
                    authority: ctx.accounts.fandom_record.to_account_info(),
                },
                &[signer_seeds],
            ),
            1,
        )?;

        ctx.accounts.fandom_record.highest_tier_claimed = tier;

        emit!(BadgeClaimedEvent {
            wallet: fan_key,
            sport,
            team,
            tier,
            mint: ctx.accounts.badge_mint.key(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(sport: String, team: String)]
pub struct CheckIn<'info> {
    #[account(mut)]
    pub fan: Signer<'info>,

    #[account(
        init_if_needed,
        payer = fan,
        space = 8 + FandomRecord::INIT_SPACE,
        seeds = [b"fandom", fan.key().as_ref(), sport.as_bytes(), team.as_bytes()],
        bump
    )]
    pub fandom_record: Account<'info, FandomRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(sport: String, team: String)]
pub struct ClaimBadge<'info> {
    #[account(mut)]
    pub fan: Signer<'info>,

    #[account(
        mut,
        seeds = [b"fandom", fan.key().as_ref(), sport.as_bytes(), team.as_bytes()],
        bump = fandom_record.bump,
    )]
    pub fandom_record: Account<'info, FandomRecord>,

    // A brand-new mint, unique per (wallet, sport, team, tier). Its own PDA
    // seeds are what actually prevent double-claiming a tier — if it already
    // exists, `init` fails outright regardless of what the account data says.
    #[account(
        init,
        payer = fan,
        seeds = [
            b"badge-mint",
            fan.key().as_ref(),
            sport.as_bytes(),
            team.as_bytes(),
            &[tier_for_streak(fandom_record.streak_count)],
        ],
        bump,
        mint::decimals = 0,
        mint::authority = fandom_record,
    )]
    pub badge_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = fan,
        associated_token::mint = badge_mint,
        associated_token::authority = fan,
    )]
    pub fan_badge_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(InitSpace)]
pub struct FandomRecord {
    pub wallet: Pubkey,
    pub streak_count: u32,
    pub last_checkin_ts: i64,
    pub bump: u8,
    pub highest_tier_claimed: u8,
    // Mirrored from the PDA seeds onto the account data itself. The seeds
    // alone let you derive *one* fan's PDA if you already know the team —
    // they can't be reversed to answer "who are all the Argentina fans?"
    // Storing sport/team here is what makes a real on-chain leaderboard
    // (getProgramAccounts + filter) possible instead of faked.
    #[max_len(32)]
    pub sport: String,
    #[max_len(32)]
    pub team: String,
}

#[event]
pub struct CheckInEvent {
    pub wallet: Pubkey,
    pub sport: String,
    pub team: String,
    pub streak_count: u32,
    pub timestamp: i64,
}

#[event]
pub struct BadgeClaimedEvent {
    pub wallet: Pubkey,
    pub sport: String,
    pub team: String,
    pub tier: u8,
    pub mint: Pubkey,
}

#[error_code]
pub enum LoyaltyError {
    #[msg("Sport name too long")]
    SportTooLong,
    #[msg("Team name too long")]
    TeamTooLong,
    #[msg("Streak count overflow")]
    Overflow,
    #[msg("No badge tier reached yet")]
    NoTierReached,
    #[msg("This tier's badge has already been claimed")]
    TierAlreadyClaimed,
}
