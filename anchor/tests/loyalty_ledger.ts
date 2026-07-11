import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";

describe("loyalty_ledger", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LoyaltyLedger as Program;

  const sport = "fifa_world_cup";
  const team = "Argentina";

  function findRecordPda(wallet: anchor.web3.PublicKey) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("fandom"),
        wallet.toBuffer(),
        Buffer.from(sport),
        Buffer.from(team),
      ],
      program.programId
    );
  }

  it("creates a fandom record on first check-in", async () => {
    const [recordPda] = findRecordPda(provider.wallet.publicKey);

    await program.methods
      .checkIn(sport, team)
      .accounts({
        fan: provider.wallet.publicKey,
        fandomRecord: recordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const record = await program.account.fandomRecord.fetch(recordPda);
    assert.equal(record.streakCount, 1);
    assert.equal(record.wallet.toBase58(), provider.wallet.publicKey.toBase58());
  });

  it("increments the streak on a second check-in", async () => {
    const [recordPda] = findRecordPda(provider.wallet.publicKey);

    await program.methods
      .checkIn(sport, team)
      .accounts({
        fan: provider.wallet.publicKey,
        fandomRecord: recordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const record = await program.account.fandomRecord.fetch(recordPda);
    assert.equal(record.streakCount, 2);
  });

  it("keeps a separate PDA per team", async () => {
    const [franceRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("fandom"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(sport),
        Buffer.from("France"),
      ],
      program.programId
    );

    await program.methods
      .checkIn(sport, "France")
      .accounts({
        fan: provider.wallet.publicKey,
        fandomRecord: franceRecordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const franceRecord = await program.account.fandomRecord.fetch(franceRecordPda);
    assert.equal(franceRecord.streakCount, 1);

    const [argentinaRecordPda] = findRecordPda(provider.wallet.publicKey);
    const argentinaRecord = await program.account.fandomRecord.fetch(argentinaRecordPda);
    assert.equal(argentinaRecord.streakCount, 2);
  });
});
