import {
  type PublicKey,
  StakeProgram,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  type Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  findAllTickets,
  findGSolMintAuthority,
  findMSolTokenAccountAuthority,
  findOrderUnstakeTicketAccount,
  findOrderUnstakeTicketManagementAccount,
  type SunriseStakeConfig,
  getValidatorIndex,
} from "./util";
import {
  type Marinade,
  type MarinadeState,
  MarinadeUtils,
} from "@sunrisestake/marinade-ts-sdk";
import { type Program, utils } from "@project-serum/anchor";
import { type SunriseStake } from "./types/SunriseStake";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { type ManagementAccount } from "./types/ManagementAccount";

export const deposit = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  marinade: Marinade,
  marinadeState: MarinadeState,
  stateAddress: PublicKey,
  staker: PublicKey,
  stakerGsolTokenAccount: PublicKey,
  lamports: BN
): Promise<Transaction> => {
  const sunriseStakeState = await program.account.state.fetch(stateAddress);
  const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
  const [gsolMintAuthority] = findGSolMintAuthority(config);
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
    {
      mint: marinadeState.mSolMintAddress,
      owner: msolTokenAccountAuthority,
    }
  );

  const liqPoolAssociatedTokenAccountAddress =
    await utils.token.associatedAddress({
      mint: marinadeState.lpMint.address,
      owner: msolTokenAccountAuthority,
    });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.deposit>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: stateAddress,
    marinadeState: marinadeState.marinadeStateAddress,
    gsolMint: sunriseStakeState.gsolMint,
    gsolMintAuthority,
    msolMint: marinadeState.mSolMint.address,
    liqPoolMint: marinadeState.lpMint.address,
    liqPoolSolLegPda: await marinadeState.solLeg(),
    liqPoolMsolLeg: marinadeState.mSolLeg,
    liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
    liqPoolMintAuthority: await marinadeState.lpMintAuthority(),
    reservePda: await marinadeState.reserveAddress(),
    transferFrom: staker,
    mintMsolTo: msolAssociatedTokenAccountAddress,
    mintLiqPoolTo: liqPoolAssociatedTokenAccountAddress,
    mintGsolTo: stakerGsolTokenAccount,
    msolMintAuthority: await marinadeState.mSolMintAuthority(),
    msolTokenAccountAuthority,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    marinadeProgram,
  };

  return program.methods.deposit(lamports).accounts(accounts).transaction();
};

export const depositStakeAccount = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  marinade: Marinade,
  marinadeState: MarinadeState,
  staker: PublicKey,
  stakeAccountAddress: PublicKey,
  stakerGsolTokenAccount: PublicKey
): Promise<Transaction> => {
  const stateAddress = config.stateAddress;

  const sunriseStakeState = await program.account.state.fetch(stateAddress);
  const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
  const [gsolMintAuthority] = findGSolMintAuthority(config);
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
    {
      mint: marinadeState.mSolMintAddress,
      owner: msolTokenAccountAuthority,
    }
  );

  type Accounts = Parameters<
    ReturnType<typeof program.methods.depositStakeAccount>["accounts"]
  >[0];

  const stakeAccountInfo = await MarinadeUtils.getParsedStakeAccountInfo(
    marinade.provider,
    stakeAccountAddress
  );
  const voterAddress = stakeAccountInfo.voterAddress;
  if (!voterAddress) {
    throw new Error("The stake account must be delegated");
  }
  console.log("voterAddress: ", voterAddress);

  console.log(
    "validator list: ",
    marinadeState.state.validatorSystem.validatorList.account.toString()
  );
  console.log(
    "stake list: ",
    marinadeState.state.stakeSystem.stakeList.account.toString()
  );
  console.log(
    "duplication flag: ",
    (await marinadeState.validatorDuplicationFlag(voterAddress)).toString()
  );

  const validatorSystem = marinadeState.state.validatorSystem;
  const stakeSystem = marinadeState.state.stakeSystem;
  const accounts: Accounts = {
    state: stateAddress,
    marinadeState: marinadeState.marinadeStateAddress,
    gsolMint: sunriseStakeState.gsolMint,
    gsolMintAuthority,
    validatorList: validatorSystem.validatorList.account,
    stakeList: stakeSystem.stakeList.account,
    stakeAccount: stakeAccountAddress,
    duplicationFlag: await marinadeState.validatorDuplicationFlag(voterAddress),
    stakeAuthority: staker,
    msolMint: marinadeState.mSolMint.address,
    mintMsolTo: msolAssociatedTokenAccountAddress,
    mintGsolTo: stakerGsolTokenAccount,
    msolMintAuthority: await marinadeState.mSolMintAuthority(),
    msolTokenAccountAuthority,
    clock: SYSVAR_CLOCK_PUBKEY,
    rent: SYSVAR_RENT_PUBKEY,
    stakeProgram: StakeProgram.programId,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    marinadeProgram,
  };
  console.log("accounts: ", accounts);

  console.log("Getting validator index");
  const validatorIndex = await getValidatorIndex(marinadeState, voterAddress);
  return program.methods
    .depositStakeAccount(validatorIndex)
    .accounts(accounts)
    .transaction();
};

const getOrderUnstakeTicketManagementAccount = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  epoch: bigint
): Promise<{
  address: PublicKey;
  bump: number;
  account: ManagementAccount | null;
}> => {
  const [address, bump] = findOrderUnstakeTicketManagementAccount(
    config,
    epoch
  );
  const account =
    await program.account.orderUnstakeTicketManagementAccount.fetchNullable(
      address
    );

  return {
    address,
    bump,
    account,
  };
};

// TODO move this into the client to avoid having to pass in so many things?
export const liquidUnstake = async (
  config: SunriseStakeConfig,
  marinade: Marinade,
  marinadeState: MarinadeState,
  program: Program<SunriseStake>,
  stateAddress: PublicKey,
  staker: PublicKey,
  stakerGsolTokenAccount: PublicKey,
  lamports: BN
): Promise<Transaction> => {
  const sunriseStakeState = await program.account.state.fetch(stateAddress);
  const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
  const [gsolMintAuthority] = findGSolMintAuthority(config);
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
    {
      mint: marinadeState.mSolMintAddress,
      owner: msolTokenAccountAuthority,
    }
  );
  // use the same token authority PDA for the msol token account
  // and the liquidity pool token account for convenience
  const liqPoolAssociatedTokenAccountAddress =
    await utils.token.associatedAddress({
      mint: marinadeState.lpMint.address,
      owner: msolTokenAccountAuthority,
    });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.liquidUnstake>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: stateAddress,
    marinadeState: marinadeState.marinadeStateAddress,
    msolMint: marinadeState.mSolMint.address,
    liqPoolMint: marinadeState.lpMint.address,
    gsolMint: sunriseStakeState.gsolMint,
    gsolMintAuthority,
    liqPoolSolLegPda: await marinadeState.solLeg(),
    liqPoolMsolLeg: marinadeState.mSolLeg,
    liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
    treasuryMsolAccount: marinadeState.treasuryMsolAccount,
    getMsolFrom: msolAssociatedTokenAccountAddress,
    getMsolFromAuthority: msolTokenAccountAuthority,
    getLiqPoolTokenFrom: liqPoolAssociatedTokenAccountAddress,
    gsolTokenAccount: stakerGsolTokenAccount,
    gsolTokenAccountAuthority: staker,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: SYSVAR_RENT_PUBKEY,
    marinadeProgram,
  };

  const { instruction: rebalanceInstruction } = await triggerRebalance(
    config,
    marinade,
    marinadeState,
    program,
    stateAddress,
    staker
  );

  return program.methods
    .liquidUnstake(lamports)
    .accounts(accounts)
    .postInstructions([rebalanceInstruction])
    .transaction();
};

export const orders = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  epoch: bigint
): Promise<{
  managementAccount: {
    address: PublicKey;
    bump: number;
    account: ManagementAccount | null;
  };
  tickets: PublicKey[];
}> => {
  const managementAccount = await getOrderUnstakeTicketManagementAccount(
    config,
    program,
    epoch
  );

  const tickets = managementAccount.account
    ? await findAllTickets(
        program.provider.connection,
        config,
        managementAccount.account,
        epoch
      )
    : [];

  return {
    managementAccount,
    tickets,
  };
};

export interface TriggerRebalanceResult {
  instruction: TransactionInstruction;
  orderUnstakeTicketAccount: PublicKey;
  managementAccount: PublicKey;
  previousManagementAccount: PublicKey;
}
export const triggerRebalance = async (
  config: SunriseStakeConfig,
  marinade: Marinade,
  marinadeState: MarinadeState,
  program: Program<SunriseStake>,
  stateAddress: PublicKey,
  payer: PublicKey
): Promise<TriggerRebalanceResult> => {
  const sunriseStakeState = await program.account.state.fetch(stateAddress);
  const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
    {
      mint: marinadeState.mSolMintAddress,
      owner: msolTokenAccountAuthority,
    }
  );
  const liqPoolAssociatedTokenAccountAddress =
    await utils.token.associatedAddress({
      mint: marinadeState.lpMint.address,
      owner: msolTokenAccountAuthority,
    });

  // TODO Add instruction to close an arbitrary ticket, in case an epoch gets missed
  const epochInfo = await program.provider.connection.getEpochInfo();
  const { managementAccount } = await orders(
    config,
    program,
    BigInt(epochInfo.epoch)
  );
  const {
    managementAccount: previousManagementAccount,
    tickets: previousEpochTickets,
  } = await orders(config, program, BigInt(epochInfo.epoch - 1));

  const previousEpochTicketAccountMetas = previousEpochTickets.map(
    (ticket) => ({
      pubkey: ticket,
      isSigner: false,
      isWritable: true,
    })
  );
  // TODO add check to see if rebalancing is needed

  // TODO Split rebalancing (order unstake) and claiming tickets - claiming tickets can be one instruction each
  // no need for remaining accounts etc.
  // Then the client bundles them together. However, this means the client will not be guaranteed to do a rebalancing
  // which costs a bit of rent.

  // TODO incrementing on the client side like this will cause clashes in future, we need to replace it
  const index = (managementAccount?.account?.tickets.toNumber() ?? 0) + 1;
  const [orderUnstakeTicketAccount, orderUnstakeTicketAccountBump] =
    findOrderUnstakeTicketAccount(
      config,
      BigInt(epochInfo.epoch),
      BigInt(index)
    );

  type Accounts = Parameters<
    ReturnType<typeof program.methods.triggerPoolRebalance>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: stateAddress,
    payer,
    marinadeState: marinadeState.marinadeStateAddress,
    gsolMint: sunriseStakeState.gsolMint,
    msolMint: marinadeState.mSolMint.address,
    liqPoolMint: marinadeState.lpMint.address,
    liqPoolSolLegPda: await marinadeState.solLeg(),
    liqPoolMsolLeg: marinadeState.mSolLeg,
    liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
    liqPoolMintAuthority: await marinadeState.lpMintAuthority(),
    liqPoolTokenAccount: liqPoolAssociatedTokenAccountAddress,
    reservePda: await marinadeState.reserveAddress(),
    treasuryMsolAccount: marinadeState.treasuryMsolAccount,
    getMsolFrom: msolAssociatedTokenAccountAddress,
    getMsolFromAuthority: msolTokenAccountAuthority,
    orderUnstakeTicketAccount,
    orderUnstakeTicketManagementAccount: managementAccount.address,
    // Utilising the new "optional named accounts" feature in Anchor 0.26.0
    // to pass this only if it exists.
    // Since this passes null instead of the address, what is to stop the client from "lying"?
    // Well, nothing in the general case, but in this case, it is in the caller's interest to pass the account,
    // as it allows them to claim rent on closure of this account and the tickets.
    previousOrderUnstakeTicketManagementAccount:
      previousManagementAccount.account
        ? previousManagementAccount.address
        : null,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: SYSVAR_CLOCK_PUBKEY,
    rent: SYSVAR_RENT_PUBKEY,
    marinadeProgram,
  };

  const instruction = await program.methods
    .triggerPoolRebalance(
      new BN(epochInfo.epoch),
      new BN(index),
      orderUnstakeTicketAccountBump,
      previousManagementAccount.bump
    )
    .accounts(accounts)
    .remainingAccounts(previousEpochTicketAccountMetas)
    .instruction();

  return {
    instruction,
    orderUnstakeTicketAccount,
    managementAccount: managementAccount.address,
    previousManagementAccount: managementAccount.address,
  };
};
