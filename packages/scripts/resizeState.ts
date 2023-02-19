import "./util";
import { AnchorProvider, Program } from "@project-serum/anchor";
import BN from "bn.js";
import { SystemProgram } from "@solana/web3.js";
import {
  IDL,
  SunriseStake,
} from "../client/types/sunrise_stake";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/constants";

/**
 * USAGE (devnet)
 *
 * ANCHOR_PROVIDER_URL=https://api.devnet.solana.com REACT_APP_SOLANA_NETWORK=devnet yarn ts-node packages/scripts/resizeState.ts 140
 */

const resizeAmount = parseInt(process.argv[2], 10);

console.log("Resizing to", resizeAmount);

(async () => {
  const provider = AnchorProvider.env();
  const program = new Program<SunriseStake>(IDL, PROGRAM_ID, provider);
  await program.methods
    .resizeState(new BN(resizeAmount))
    .accounts({
      state: SUNRISE_STAKE_STATE,
      payer: provider.publicKey,
      updateAuthority: provider.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
})().catch(console.error);
