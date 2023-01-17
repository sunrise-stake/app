import {
  AccountInfo,
  ConfirmOptions,
  Connection,
  PublicKey,
  TokenAmount,
  Transaction,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, BN } from "@project-serum/anchor";
import { ManagementAccount } from "./types/ManagementAccount";

export const enum ProgramDerivedAddressSeed {
  G_SOL_MINT_AUTHORITY = "gsol_mint_authority",
  M_SOL_ACCOUNT = "msol_account",
  ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT = "order_unstake_ticket_mgmt",
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

  options: Options;
}

// Return the type of an element in an array
// type A = ArrayElement<string[]>; // string
// type B = ArrayElement<readonly string[]>; // string
// type C = ArrayElement<[string, number]>; // string | number
// type D = ArrayElement<["foo", "bar"]>; // "foo" | "bar"
// type E = ArrayElement<(P | (Q | R))[]>; // P | Q | R
type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends ReadonlyArray<infer ElementType> ? ElementType : never;

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
  config: SunriseStakeConfig,
  epoch: bigint
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
  config: SunriseStakeConfig,
  epoch: bigint,
  index: bigint
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

export const setUpAnchor = (): anchor.AnchorProvider => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  return provider;
};

export interface Balance {
  gsolBalance: TokenAmount;
  gsolSupply: TokenAmount;
  msolBalance: TokenAmount;
  msolPrice: number;
  liqPoolBalance: TokenAmount;
  treasuryBalance: number;
}

export const PROGRAM_ID = new PublicKey(
  "sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6"
);

export const ZERO_BALANCE = {
  value: {
    amount: "0",
    decimals: 9,
    uiAmount: 0,
    uiAmountString: "0",
  },
};

export interface Options {
  confirmOptions?: ConfirmOptions;
  verbose?: boolean;
}
export const findAllTickets = async (
  connection: Connection,
  config: SunriseStakeConfig,
  managementAccount: ManagementAccount
): Promise<PublicKey[]> => {
  const epochInfo = await connection.getEpochInfo();
  const lastEpoch = BigInt(epochInfo.epoch - 1);

  // find all tickets for the last epoch in reverse order, this allows us to better paginate later
  const tickets: PublicKey[] = [];
  for (let i = managementAccount.tickets.toNumber(); i > 0; i--) {
    const [orderUnstakeTicketAccount] = findOrderUnstakeTicketAccount(
      config,
      lastEpoch,
      BigInt(i)
    );

    tickets.push(orderUnstakeTicketAccount);
  }
  // TODO Later add pagination here in case the count is too high for one call
  const accountInfos = await connection.getMultipleAccountsInfo(tickets);

  return accountInfos
    .map((accountInfo, i): [PublicKey, ArrayElement<typeof accountInfos>] => [
      tickets[i],
      accountInfo,
    ])
    .filter(
      (element): element is [PublicKey, AccountInfo<Buffer>] =>
        element[1] !== null
    )
    .map(([ticket, accountInfo]) => ticket);
};

export const proportionalBN = (
  amount: BN,
  numerator: BN,
  denominator: BN
): BN => {
  if (denominator.isZero()) {
    return amount;
  }
  const result =
    (BigInt(amount.toString()) * BigInt(numerator.toString())) /
    BigInt(denominator.toString());
  return new BN(result.toString());
};
