import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export const enum ProgramDerivedAddressSeed {
  G_SOL_MINT_AUTHORITY = "gsol_mint_authority",
  M_SOL_ACCOUNT = "msol_account",
  ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT= "order_unstake_ticket_mgmt",
  ORDER_UNSTAKE_TICKET_ACCOUNT = "order_unstake_ticket_account",
}

export interface SunriseStakeConfig {
  stateAddress: PublicKey;
  gsolMint: PublicKey;
  treasury: PublicKey;
  updateAuthority: PublicKey;
  programId: PublicKey;
  liqPoolProportion: number;

  liqPoolMinProportion: number;
}

const findProgramDerivedAddress = (
    config: SunriseStakeConfig,
    seed: ProgramDerivedAddressSeed,
    extraSeeds: Buffer[] = []
): [PublicKey, number] => {
  const seeds = [
    config.stateAddress.toBuffer(),
    Buffer.from(seed),
    ...extraSeeds,
  ];
  return PublicKey.findProgramAddressSync(seeds, config.programId);
};

export const findMSolTokenAccountAuthority = (
    config: SunriseStakeConfig
): [PublicKey, number] =>
    findProgramDerivedAddress(config, ProgramDerivedAddressSeed.M_SOL_ACCOUNT);

export const findGSolMintAuthority = (
    config: SunriseStakeConfig
): [PublicKey, number] =>
    findProgramDerivedAddress(
        config,
        ProgramDerivedAddressSeed.G_SOL_MINT_AUTHORITY
    );

export const findOrderUnstakeTicketManagementAccount = (
    config: SunriseStakeConfig, epoch: bigint
): [PublicKey, number] => {
    const epochBuf = Buffer.allocUnsafe(8);
    epochBuf.writeBigInt64BE(epoch, 0);
    return findProgramDerivedAddress(
        config,
        ProgramDerivedAddressSeed.ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT,
        [epochBuf]
    );
};

export const findOrderUnstakeTicketAccount = (
    config: SunriseStakeConfig, epoch: bigint, index: bigint
): [PublicKey, number] => {
    const epochBuf = Buffer.allocUnsafe(8);
    epochBuf.writeBigInt64BE(epoch, 0);

    const indexBuf = Buffer.allocUnsafe(8);
    indexBuf.writeBigInt64BE(index, 0);

    return findProgramDerivedAddress(
        config,
        ProgramDerivedAddressSeed.ORDER_UNSTAKE_TICKET_ACCOUNT,
        [epochBuf, indexBuf]
    );
};

export const logKeys = (transaction: Transaction): void =>
    transaction.instructions.forEach((instruction, j) => {
      instruction.keys.forEach((key, i) => {
        console.log(j, i, key.pubkey.toBase58());
      });
    });

export const confirm = (connection: Connection) => async (txSig: string) =>
    connection.confirmTransaction({
      signature: txSig,
      ...(await connection.getLatestBlockhash()),
    });
