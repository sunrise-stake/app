export interface Details {
  staker: string;
  stakerGSolTokenAccount: string;
  sunriseStakeConfig: {
    gsolMint: string;
    programId: string;
    stateAddress: string;
    treasury: string;
    msolTokenAccount?: string;
    msolTokenAccountAuthority?: string;
  };
  marinadeFinanceProgramId: string;
  marinadeStateAddress: string;
  msolLeg: string;
  msolPrice: number;
  sunriseMsolBalance: number | null;
  stakeDelta: number;
  lpDetails: {
    mintAddress: string;
    supply: bigint;
    mintAuthority?: string;
    decimals: number;
    lpBalance: number | null;
    lpSolValue: number;
  };
}
