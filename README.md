# Sunrise Stake

SunriseStake provides sustainable funding to climate projects on Solana,
by routing yield earned through staking SOL.

Stakers receive gSOL, a synthetic derivative token that is 1:1 redeemable for SOL.

Each gSol represents a staked SOL that is earning yield for a climate project.

Protocols, dApps, NFT projects, and other builders on Solana can accept gSOL
as an alternative to SOL, and by doing so, they can help fund climate projects,
as well as strengthen the Solana ecosystem through staking.

## Quick Start

```shell
$ yarn
$ anchor build
$ anchor localnet
```

and in another shell

```shell
$ cd app
$ yarn start
```

## FAQ

TODO

## How it works

### Synthetic gSol and Common mSol

For each Sol that a user deposits, the receive exactly 1 gSol in return. This gSol can be burned to redeem the initial Sol from the pool.

The Sol is passed to Marinade, and the equivalent mSol is minted at the current mSol price.

This mSol is stored in a token account owned by the pool. This is a common token account owned by the pool - users do no have their own mSol token account.

When the user withdraws their Sol, the protocol calculates the appropriate amount of mSol to withdraw with Marinade to retrieve 1 Sol back.
The yield is the difference between the mSol minted during deposit and the mSol withdrawn during withdrawal. This yield remains staked in the pool.

### Cranking

If the yield remains staked in the pool, it can never be funnelled to the funding recipients.

Therefore, the protocol includes a "crank" mechanism - a permissionless instruction that triggers the withdrawal of Sol from the pool
and its transfer to the funding strategy (see below).

The crank is attempted on each deposit and withdrawal.
The parameters of the pool determine how frequently a crank may be turned, and what happens to the withdrawn funds.

For example, a pool may be configured to transfer 100% of its accrued yield on each epoch.
Conversely, it may transfer only 10% of its yield, and keep the remaining 90% staked to avail of compounding.

### The Funding Strategy

Each pool is associated with a funding strategy. This is a program which is responsible for receiving the yield from the pool and executing a
preconfigured task, such as swapping for a carbon token, or investing in a DAO treasury.

The default funding strategy is one which swaps into a carbon token which it then subsequently burns. 