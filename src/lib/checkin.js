// Stubbed sports (NBA / Other) use the exact same UI/flow as World Cup but
// never touch the network — they resolve after a short delay with an
// obviously-fake signature so the demo is honest about what is and isn't
// real. See README "What's next". The real, working path (World Cup) calls
// the on-chain Anchor program directly — see lib/onchainRecords.js.
export function mockCheckinTransaction() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fake = Array.from({ length: 8 }, () =>
        Math.random().toString(36).slice(2, 6)
      ).join("");
      resolve(`MOCK-${fake}`);
    }, 700);
  });
}
