# Sunrise Stake

SunriseStake provides sustainable funding to climate projects on Solana,
by routing yield earned through staking SOL.

Stakers receive gSOL, a synthetic derivative token that is 1:1 redeemable for SOL.

Each gSOL represents a staked SOL that is earning yield for a climate project.

Protocols, dApps, NFT projects, and other builders on Solana can accept gSOL
as an alternative to SOL, and by doing so, they can help fund climate projects,
as well as strengthen the Solana ecosystem through staking.

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
anchor test
```

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

## FAQ

Note, for more details, visit the [docs](https://docs.sunrisestake.com).

## How it works

### Synthetic gSOL and Common mSOL

For each Sol that a user deposits, the receive exactly 1 gSOL in return. This gSOL can be burned to redeem the initial Sol from the pool.

The Sol is passed to Marinade, and the equivalent mSOL is minted at the current mSOL price.

This mSOL is stored in a token account owned by the pool. This is a common token account owned by the pool - users do no have their own mSOL token account.

When the user withdraws their Sol, the protocol calculates the appropriate amount of mSOL to withdraw with Marinade to retrieve 1 Sol back.
The yield is the difference between the mSOL minted during deposit and the mSOL withdrawn during withdrawal. This yield remains staked in the pool.

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
