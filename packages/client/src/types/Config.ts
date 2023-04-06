import { type PublicKey } from "@solana/web3.js";
import { type Options } from "../util";

export interface SunriseStakeConfig {
  stateAddress: PublicKey;
  gsolMint: PublicKey;
  treasury: PublicKey;
  updateAuthority: PublicKey;
  programId: PublicKey;
  liqPoolProportion: number;
  liqPoolMinProportion: number;
  options: Options;
  impactNFTStateAddress: PublicKey | undefined; // a state can exist without an impact nft state
}

export interface SunriseTokenConfig {
  gsolMintAuthority: [PublicKey, number];
  msolTokenAccount: PublicKey;
  msolTokenAccountAuthority: [PublicKey, number];
  bsolTokenAccount: PublicKey;
  bsolTokenAccountAuthority: [PublicKey, number];
  liqPoolTokenAccount: PublicKey;
}
