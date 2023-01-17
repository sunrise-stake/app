import { SunriseStakeClient } from "../app/src/lib/client/";
import { Keypair, PublicKey } from "@solana/web3.js";
import "./util";

// Used in devnet and for local testing
const defaultTreasuryKey = "stdeYBs3MUtQN7zqgAQaxvsYemxncJKNDMJhciHct9M";

const treasuryKey = new PublicKey(
  process.env.TREASURY_KEY ?? defaultTreasuryKey
);

const gsolMintKeypair = Keypair.fromSecretKey(
  Buffer.from(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require(process.env.GSOL_MINT_KEYPAIR ??
      process.cwd() + "/gso1xA56hacfgTHTF4F7wN5r4jbnJsKh99vR595uybA.json")
  )
);

(async () => {
  const client = await SunriseStakeClient.register(
    treasuryKey,
    gsolMintKeypair
  );
  const details = await client.details();
  console.debug("Registered state", details);
  console.log("State address", client.stateAddress.toBase58());
})().catch(console.error);
