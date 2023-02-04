# Sunrise Stake

What is Sunrise Stake?


Sunrise Stake is a ReFi staking protocol that directs staking yield to climate-positive projects.

At Sunrise Stake we believe in the power of Regenerative Finance to create positive outcomes
for people and the planet. So we’ve created a non-custodial and permissionless protocol
to send the yield earned through staking SOL towards retiring carbon tokens and other
climate-positive projects.

Sunrise Stake is one of the first ReFi projects on the Solana blockchain;
we provide a seamless way for holders of SOL to participate in the ReFi movement,
while simultaneously strengthening the Solana blockchain.

For more details, visit the [docs](https://docs.sunrisestake.com).

## Quick Start

```shell
$ yarn
$ anchor build
$ anchor localnet
```
and in another shell.
```shell
$ cd packages/app
$ yarn start
```

To run the tests, __close__ the validator in the first shell and run
```shell
yarn test
```

## How it works

Note, for more details, visit the [docs](https://docs.sunrisestake.com).

#### Step 1: Depositing SOL with Sunrise Stake

![staking_white_without_comments.png](/img/staking_white_without_comments.png)

The staking process begins with you depositing your SOL via Sunrise Stake’s app.

Your SOL will be deposited into the underlying pools.

The majority of the SOL is deposited into a set of [Stake Pools](https://solana.org/stake-pools).
At present, Sunrise Stake deposits into the [Marinade Finance](https://docs.marinade.finance/) and [SolBlaze] (https://stake-docs.solblaze.org/) pools.
The stake pool tokens (mSOL and bSOL) are held by the protocol in a [Program Derived Address (PDA)](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses).

A proportion of the deposited SOL is also deposited into the [Marinade Unstake Pool](https://docs.marinade.finance/marinade-protocol/system-overview/unstake-liquidity-pool).
This pool is used during the unstaking process to provide fee-less unstaking, ensuring that users can withdraw their SOL at any time without incurring a fee.

When you deposit your SOL, you will receive an equivalent amount of gSOL in your wallet.
gSOL can be used in the same way as SOL, by protocols or recipients that support it.

#### Step 2: Accruing yield

![accruing_yield_white.png](/img/accruing_yield_white.png)

###### Stake Pools
At the end of each epoch (every 2 or 3 days), yield gets paid out into stake accounts,
and the value of the overall stake pool increases.

As mSOL and bSOL represent a share of their respective stake pools, the value of mSOL and bSOL also increases.

The yield accrued on the staked SOL is equal to the value of mSOL and bSOL held by Sunrise
minus the value of SOL staked (calculated as the circulating supply of gSOL).

###### Liquidity Pool

The Marinade Unstake Pool also accrues yield through fees from the marinade liquid unstaking feature.
The total value of the holdings of the Sunrise protocol are therefore:

- The value of mSOL and bSOL held by Sunrise
- The value of the liquidity pool tokens held by Sunrise

### Step 3: Unstaking

![unstaking_white_without_comments.png](/img/unstaking_white_without_comments.png)

If you unstake your SOL, Sunrise calculates how much of its share of the underlying stake and liquidity pools to sell, in order to receive your SOL.

Unstaking draws from the liquidity pool balance first, and then from the stake pools as needed.

For example, if you decide to unstake 100 SOL, and the value of the Sunrise-held liquidity pool tokens are currently at 90,
Sunrise will withdraw 90 from the liquidity pool, and the remaining 10 from the stake pools.

Sunrise will also trigger a "rebalancing" transaction, that moves SOL from the stake pools into the liquidity pool,
in order to maintain a 10% liquidity pool balance.

![rebalancing_white.png](/img/rebalancing_white.png)

## Sunrise Stake treasury spending

Thanks to the yield earned in the staking process, Sunrise can purchase carbon tokens and burn them to offset carbon emissions.

![yield_controller_white_without_comments.png](/img/yield_controller_white_without_comments.png)

#### 1. Yield transfer to the treasury account

The yield earned from staking SOL is transferred to the __treasury account__.

It is a Program Derived Address ([PDA](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses))
meaning that it is owned and controlled by a smart contract, not a private key.

This smart contract is known as the [treasury controller](https://github.com/sunrise-stake/treasury-controller).
It can trigger a state change to buy or burn carbon tokens, thus retiring underlying carbon credits.

#### 2. Purchasing carbon tokens

The carbon token used by Sunrise Stake is the Toucan Nature Carbon Tonne token.

NCT represents a tonne of CO2 or equivalent greenhouse gas removed from the atmosphere in various nature-based projects.
It is issued on the Polygon and Celo blockchains and has been bridged to Solana via [Wormhole](https://wormhole.com/).

More on the NCT can be found on Toucan’s [blog](https://blog.toucan.earth/announcing-nct-nature-carbon-tonne/) or [GitHub](https://github.com/ToucanProtocol/contracts) repository.

The Solana bridged token mint address is [7sbtAMfAuSfsUvZKPWiXUXaizYCnpLL2BBnKNTU3wjfT](https://solscan.io/token/7sbtAMfAuSfsUvZKPWiXUXaizYCnpLL2BBnKNTU3wjfT).

#### 3. Burning the Carbon Tokens

The Sunrise [treasury controller](https://github.com/sunrise-stake/treasury-controller) purchases NCT from a DEX, and burns them.

_NOTE_:
Until sufficient liquidity is present on Solana for NCT, Sunrise is maintaining a reserve of bridged NCT, and is automatically burning from this pot at a fixed price.

## Deployed Addresses:

| Account                             | Mainnet                                                                                                                          | Devnet                                                                                                                                          | Description                                                                                                                                                                         | Notes |
|-------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------|
| Sunrise Program                     | [sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6](https://explorer.solana.com/address/sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6)   | [sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6](https://explorer.solana.com/address/sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6?cluster=devnet)   | Program address for the main Sunrise Program                                                                                                                                        |       |
| Sunrise State                       | [43m66crxGfXSJpmx5wXRoFuHubhHA1GCvtHgmHW6cM1P](https://explorer.solana.com/address/43m66crxGfXSJpmx5wXRoFuHubhHA1GCvtHgmHW6cM1P) | [Jpp29FzyV7rXdVRWFaiE9tBcVCaEMvj16gk87rC3S4z](https://explorer.solana.com/address/Jpp29FzyV7rXdVRWFaiE9tBcVCaEMvj16gk87rC3S4z?cluster=devnet)   | State PDA describing the configuration of the Sunrise stake pool proxy.                                                                                                             |       |
| State Update Authority              | [48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv](https://explorer.solana.com/address/48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv) | [48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv](https://explorer.solana.com/address/48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv?cluster=devnet) | Update authority for the Sunrise state. In future this will be controlled by the [DAO](https://app.realms.today/dao/sunrisestake)                                                   |       |
| gSOL Mint                           | [gso1xA56hacfgTHTF4F7wN5r4jbnJsKh99vR595uybA](https://explorer.solana.com/address/gso1xA56hacfgTHTF4F7wN5r4jbnJsKh99vR595uybA)   | [gso1xA56hacfgTHTF4F7wN5r4jbnJsKh99vR595uybA](https://explorer.solana.com/address/gso1xA56hacfgTHTF4F7wN5r4jbnJsKh99vR595uybA?cluster=devnet)   | Mint for the gSOL synthetic SOL derivative                                                                                                                                          |       |
| TreasuryController Program          | [stcGmoLCBsr2KSu2vvcSuqMiEZx36F32ySUtCXjab5B](https://explorer.solana.com/address/stcGmoLCBsr2KSu2vvcSuqMiEZx36F32ySUtCXjab5B)   | [stcGmoLCBsr2KSu2vvcSuqMiEZx36F32ySUtCXjab5B](https://explorer.solana.com/address/stcGmoLCBsr2KSu2vvcSuqMiEZx36F32ySUtCXjab5B?cluster=devnet)   | Program address for the [treasury controller](https://github.com/sunrise-stake/treasury-controller)                                                                                 |       |
| TreasuryController State            | [htGs6L3pCRxgfkJP2vLUdb9hVPtcE4mKsdWP4CnirQA](https://explorer.solana.com/address/htGs6L3pCRxgfkJP2vLUdb9hVPtcE4mKsdWP4CnirQA)   | [77aJfgRudbv9gFfjRQw3tuYzgnjoDgs9jorVTmK7cv73](https://explorer.solana.com/address/77aJfgRudbv9gFfjRQw3tuYzgnjoDgs9jorVTmK7cv73?cluster=devnet) | State PDA describing the configuration of the treasury controller - includes references to the token mint to purchase, proportion to pass to the treasury (currently 0) etc.        |       |
| TreasuryController Update Authority | [48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv](https://explorer.solana.com/address/48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv) | [48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv](https://explorer.solana.com/address/48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv?cluster=devnet) | Update authority for the treasury controller state. In future this will be controlled by the [DAO](https://app.realms.today/dao/sunrisestake)                                       |       |
| Yield Account                       | [F7P4qYbVKFiiD4dQpwwVS6ao22DLr2sAF7Z3cCHneC8w](https://explorer.solana.com/address/F7P4qYbVKFiiD4dQpwwVS6ao22DLr2sAF7Z3cCHneC8w) | [7aYixZPfCbYpFGpRxx1knLpaVHJgmszXDpSp3f4abodg](https://explorer.solana.com/address/7aYixZPfCbYpFGpRxx1knLpaVHJgmszXDpSp3f4abodg?cluster=devnet) | PDA, owned by the treasury controller, that yield from Sunrise is deposited into, pending spending.                                                                                 |       |
| Treasury Account                    | [Bup7DZk56XwQUDzuvBz9nzbr8e2iLPVrBpha1KTfEbbJ](https://explorer.solana.com/address/Bup7DZk56XwQUDzuvBz9nzbr8e2iLPVrBpha1KTfEbbJ) | [stdeYBs3MUtQN7zqgAQaxvsYemxncJKNDMJhciHct9M](https://explorer.solana.com/address/stdeYBs3MUtQN7zqgAQaxvsYemxncJKNDMJhciHct9M?cluster=devnet)   | [Sunrise DAO](https://app.realms.today/dao/sunrisestake) treasury account                                                                                                           |       |
| NCT Mint                            | [7sbtAMfAuSfsUvZKPWiXUXaizYCnpLL2BBnKNTU3wjfT](https://explorer.solana.com/address/7sbtAMfAuSfsUvZKPWiXUXaizYCnpLL2BBnKNTU3wjfT) | [tnct1RC5jg94CJLpiTZc2A2d98MP1Civjh7o6ShmTP6](https://explorer.solana.com/address/tnct1RC5jg94CJLpiTZc2A2d98MP1Civjh7o6ShmTP6?cluster=devnet)   | Carbon token bought and burned by the treasury controller: [Toucan NCT](https://blog.toucan.earth/announcing-nct-nature-carbon-tonne/) - bridged via Wormhole from Polygon.         |       |
| Holding Account SOL                 | [shcFT8Ur2mzpX61uWQRL9KyERZp4w2ehDEvA7iaAthn](https://explorer.solana.com/address/shcFT8Ur2mzpX61uWQRL9KyERZp4w2ehDEvA7iaAthn)   | [dhcB568T3skiP2D9ujf4eAJEnW2gACaaA9BUCVbwbXD](https://explorer.solana.com/address/dhcB568T3skiP2D9ujf4eAJEnW2gACaaA9BUCVbwbXD?cluster=devnet)   | Recipient account for SOL used to purchase NCT. (Temporary, until a liquid market for NCT exists on Solana)                                                                         |       |
| Holding Account NCT                 | [9tGKhW8WGkmx1tkxLoMwanb3XgQ9yJFDPnNggYjb1KUR](https://explorer.solana.com/address/9tGKhW8WGkmx1tkxLoMwanb3XgQ9yJFDPnNggYjb1KUR) | [8JGR8UdjLxduLpkn57H3MuoNapFovefXvMZ7k4dNM2a2](https://explorer.solana.com/address/8JGR8UdjLxduLpkn57H3MuoNapFovefXvMZ7k4dNM2a2?cluster=devnet) | NCT account made available to the Treasury Controller to purchase from. TreasuryController state account is a delegate. (Temporary, until a liquid market for NCT exists on Solana) |       |
