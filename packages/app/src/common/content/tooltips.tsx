const tooltips = {
  yourStake: <>Your total staked SOL</>,
  totalStake: <>The sum of everyones staked SOL</>,
  offsetCO2: (
    <>
      Tonnes of Carbon Dioxide or equivalent (tCO₂E) offset by Sunrise so far.
      Note: This number includes yield that Sunrise has accrued, but not yet
      spent
    </>
  ),
  withdraw: (
    <>
      Withdraw your funds by converting gSOL back to SOL. You can choose between
      immediate and delayed withdrawal. Immediate withdrawal draws funds from
      the Marinade liquidity pool. If the pool is low, it may incur a fee.
      Delayed withdrawal is always free. You will receive a ticket which can be
      redeemed at the end of the Solana Epoch to receive your SOL.
    </>
  ),
  marinadeStakePool: (
    <>The proportion of funds staked in the Marinade Stake Pool.</>
  ),
  marinadeLiquidityPool: (
    <>
      The proportion of funds staked in the Marinade{" "}
      <a
        className="font-bold text-green-bright brightness-125 hover:brightness-100"
        href="https://docs.marinade.finance/marinade-protocol/system-overview/unstake-liquidity-pool"
        target="_blank"
        rel="noreferrer"
      >
        Liquid Unstake Pool
      </a>
      . Sunrise keeps a balance in this pool in order to enable{" "}
      <a
        className="font-bold text-green-bright brightness-125 hover:brightness-100"
        href="https://docs.sunrisestake.com/#step-3-unstaking"
        target="_blank"
        rel="noreferrer"
      >
        fee-less liquid withdrawals
      </a>
      .
    </>
  ),
  solblazeStakePool: (
    <>The proportion of funds staked in the SolBlaze Stake Pool.</>
  ),
  inflight: (
    <>
      The proportion of funds currently being moved from the stake pools to the
      liquidity pool, in order to{" "}
      <a
        className="font-bold text-green-bright brightness-125 hover:brightness-100"
        href="https://docs.sunrisestake.com/#step-3-unstaking"
        target="_blank"
        rel="noreferrer"
      >
        rebalance
      </a>{" "}
      the pools. This balance is locked until the end of the Solana epoch.
    </>
  ),
  extractableYield: (
    <>
      The proportion of funds that have been accrued by Sunrise and are ready to
      be spent on retiring carbon credits. Once this balance reaches a limit, it
      will be extracted by the{" "}
      <a
        className="font-bold text-green-bright brightness-125 hover:brightness-100"
        href="https://docs.sunrisestake.com/#sunrise-stake-treasury-spending"
        target="_blank"
        rel="noreferrer"
      >
        Yield Controller
      </a>{" "}
      and used to purchase and burn carbon tokens.
    </>
  ),
  lockYield: (
    <>
      The amount of yield accrued by sunrise that is attributable to your locked
      stake. This value stays with you after you unlock, and will increase again
      when you relock.
    </>
  ),
  lockCarbon: (
    <>
      The amount of Carbon Dioxide or equivalent (tCO₂E) that your locked yield
      is equivalent to. NOTE: This is based on current carbon and SOL prices
      only, and does not equate to an actual amount of carbon offset.
    </>
  ),
};

export { tooltips };
