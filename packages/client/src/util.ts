import {
  type AccountInfo,
  type ConfirmOptions,
  type Connection,
  PublicKey,
  type TokenAmount,
  type Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, BN } from "@project-serum/anchor";
import {
  type MarinadeState,
  MarinadeUtils,
  Provider,
  type Wallet,
} from "@sunrisestake/marinade-ts-sdk";
import { type Details } from "./types/Details";
import { MAX_NUM_PRECISION } from "./constants";

// zero bn number
export const ZERO = new BN(0);

export const toSol = (lamports: BN, precision = MAX_NUM_PRECISION): number =>
  lamports.div(new BN(10).pow(new BN(precision))).toNumber() /
  (LAMPORTS_PER_SOL / 10 ** precision);

export const enum ProgramDerivedAddressSeed {
  G_SOL_MINT_AUTHORITY = "gsol_mint_authority",
  M_SOL_ACCOUNT = "msol_account",
  B_SOL_ACCOUNT = "bsol_account",
  EPOCH_REPORT_ACCOUNT = "epoch_report",
  ORDER_UNSTAKE_TICKET_ACCOUNT = "order_unstake_ticket_account",
  LOCK_ACCOUNT = "lock_account",
  LOCK_TOKEN_ACCOUNT = "lock_token_account",
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

export const findBSolTokenAccountAuthority = (
  config: SunriseStakeConfig
): [PublicKey, number] =>
  findProgramDerivedAddress(config, ProgramDerivedAddressSeed.B_SOL_ACCOUNT);

export const findGSolMintAuthority = (
  config: SunriseStakeConfig
): [PublicKey, number] =>
  findProgramDerivedAddress(
    config,
    ProgramDerivedAddressSeed.G_SOL_MINT_AUTHORITY
  );

export const findEpochReportAccount = (
  config: SunriseStakeConfig
): [PublicKey, number] =>
  findProgramDerivedAddress(
    config,
    ProgramDerivedAddressSeed.EPOCH_REPORT_ACCOUNT
  );

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

export const findLockAccount = (
  config: SunriseStakeConfig,
  authority: PublicKey
): [PublicKey, number] =>
  findProgramDerivedAddress(config, ProgramDerivedAddressSeed.LOCK_ACCOUNT, [
    authority.toBuffer(),
  ]);

export const findLockTokenAccount = (
  config: SunriseStakeConfig,
  authority: PublicKey
): [PublicKey, number] =>
  findProgramDerivedAddress(
    config,
    ProgramDerivedAddressSeed.LOCK_TOKEN_ACCOUNT,
    [authority.toBuffer()]
  );

export const logKeys = (transaction: Transaction): void => {
  transaction.instructions.forEach((instruction, j) => {
    instruction.keys.forEach((key, i) => {
      console.log(j, i, key.pubkey.toBase58());
    });
  });
};

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
  bsolBalance: TokenAmount;
  holdingAccountBalance: number;
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

/**
 * Find all open delayed unstake tickets for the given epoch
 * @param connection
 * @param config
 * @param epoch
 * @param expectedCount
 */
export const findAllTickets = async (
  connection: Connection,
  config: SunriseStakeConfig,
  epoch: bigint,
  expectedCount: number
): Promise<PublicKey[]> => {
  // find all tickets for the last epoch in reverse order, this allows us to better paginate later
  const tickets: PublicKey[] = [];
  // get the public keys for all the accounts
  for (let i = expectedCount - 1; i >= 0; i--) {
    const [orderUnstakeTicketAccount] = findOrderUnstakeTicketAccount(
      config,
      epoch,
      BigInt(i)
    );

    tickets.push(orderUnstakeTicketAccount);
  }
  // get the actual accounts (in case they have been closed somehow in the meantime)
  // TODO Later add pagination here in case the count is too high for one call
  const accountInfos = await connection.getMultipleAccountsInfo(tickets);

  // remove missing accounts and return the pubkeys of the non-missing ones.
  return accountInfos
    .map((accountInfo, i): [PublicKey, ArrayElement<typeof accountInfos>] => [
      tickets[i],
      accountInfo,
    ])
    .filter(
      (element): element is [PublicKey, AccountInfo<Buffer>] =>
        element[1] !== null
    )
    .map(([ticket]) => ticket);
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

export const getStakeAccountInfo = async (
  stakeAccount: PublicKey,
  anchorProvider: AnchorProvider
): Promise<MarinadeUtils.ParsedStakeAccountInfo> => {
  const provider = new Provider(
    anchorProvider.connection,
    anchorProvider.wallet as Wallet,
    {}
  );

  return MarinadeUtils.getParsedStakeAccountInfo(provider, stakeAccount);
};

export const getVoterAddress = async (
  stakeAccount: PublicKey,
  provider: AnchorProvider
  // program: Program<SunriseStake>,
): Promise<PublicKey> => {
  const info = await getStakeAccountInfo(stakeAccount, provider);
  if (!info.voterAddress) {
    throw new Error(`Stake account must be delegated`);
  }
  return info.voterAddress;
};

export const getValidatorIndex = async (
  marinadeState: MarinadeState,
  voterAddress: PublicKey
): Promise<number> => {
  const { validatorRecords } = await marinadeState.getValidatorRecords();
  const validatorLookupIndex = validatorRecords.findIndex(
    ({ validatorAccount }) => validatorAccount.equals(voterAddress)
  );
  return validatorLookupIndex === -1
    ? marinadeState.state.validatorSystem.validatorList.count
    : validatorLookupIndex;
};

export const marinadeTargetReached = (
  details: Details,
  percentageStakeToMarinade: number
): boolean => {
  const msolValue = details.mpDetails.msolValue;
  const lpValue = details.lpDetails.lpSolValue;
  const totalMarinade = msolValue.add(lpValue);
  const totalValue = totalMarinade.add(details.bpDetails.bsolValue);

  const limit = proportionalBN(
    totalValue,
    new BN(percentageStakeToMarinade),
    new BN(100)
  );

  return totalMarinade.gt(limit);
};
