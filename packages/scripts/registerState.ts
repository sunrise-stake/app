import { SunriseStakeClient } from "../app/src/lib/client/";
import { PublicKey } from "@solana/web3.js";
import "./util";

// Used in devnet and for local testing
const defaultTreasuryKey = "stdeYBs3MUtQN7zqgAQaxvsYemxncJKNDMJhciHct9M";

const treasuryKey = new PublicKey(
  process.env.TREASURY_KEY ?? defaultTreasuryKey
);

(async () => {
  const client = await SunriseStakeClient.register(treasuryKey);
  const details = await client.details();
  console.debug("Registered state", details);
  console.log("State address", client.stateAddress.toBase58());
})().catch(console.error);
