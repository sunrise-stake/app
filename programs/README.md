# Sunrise Programs

The Sunrise protocol is made up the following Solana programs:

- gSOL Mint Manager
- Sunbeams:
  - SPL Stake Pool Beam
  - Marinade Stake Pool Beam
  - Marinade Liquidity Pool Beam
- [TODO] Lock & Mint program (?)

## GSol Mint Manager

The gSOL Mint Manager is a program that manages the gSOL token mint. It is responsible for:
- Managing overall sunrise state
- Approving Sunbeams (see below)
- Minting gSOL tokens when users deposit into an approved sunbeam
- Burning gSOL tokens when users withdraw from an approved sunbeam
- Redeeming order-unstake tickets or undelegated stake pools after their cooldown periods

## Sunbeams

### Introduction

Sunbeams are sources of yield for the Sunrise protocol. Each sunbeam proxies some yield source, such as
a stake pool or liquidity pool, and routes accrued yield to a designated yield account, as determined by
the gSOL Mint Manager state.

Users depositing in a sunbeam earn gSOL tokens, minted by the gSOL Mint Manager. gSOL is a
synthetic derivative of SOL, which is redeemable for SOL at a 1:1 ratio. Users can redeem their gSOL
by withdrawing from any sunbeam. However, the gSOL mint manager is responsible for ensuring that 
sunbeams remain balanced, and will only allow withdrawals from or deposits to sunbeams that are
not over or under their target balances.

### Withdrawal

While all sunbeams are roughly equivalent when depositing (i.e. they have a similar API),
they differ when withdrawing. Withdrawals from some pools are immediate, but withdrawals from
others have a cooldown period. Additionally, some pools have higher withdrawal fees than others.

Each sunbeam has its own client, and the overall sunrise client is responsible for determining
which sunbeam to withdraw from. The client will first attempt to withdraw from sunbeams with the lowest
fees. 

### Sunbeam Types

#### SPL Stake Pool Beam

The SPL Stake Pool beam proxies the SPL Stake Pool program. SPL Stake Pools do not support liquid withdrawal,
and has variable fees, depending on the configuration of the pool. 

[TODO] Consider adding unstake.it to this beam to support liquid unstake

#### Marinade Stake Pool Beam

The Marinade Stake Pool beam proxies the Marinade Stake Pool program.
Marinade has support for liquid withdrawal, but charges a high fee (3%).

#### Marinade Liquidity Pool Beam

The Marinade Liquidity Pool beam proxies the Marinade Liquidity Pool, which is an unbalanced mSOL/SOL AMM.

The Marinade program uses this pool to support liquid withdrawal from the Marinade Stake Pool.
It is unbalanced, because the Marinade protocol aims to keep the mSOL balance in the pool to zero.
When users deposit into the stake pool, mSOL is first issued from the liquidity pool, until the mSOL leg
is exhausted, after which new mSOL is minted.

When users liquid withdraw from the stake pool, mSOL is exchanged for SOL in the liquidity pool.
Liquidity providers can deposit SOL into the liquidity pool to earn yield on this swap. Withdrawing liquidity
from this pool has zero fee, unlike the stake pool, however liquidity providers will receive a mix of SOL and
mSOL, depending on the current balance of the pool.

Sunrise uses this liquidity pool in order to allow zero-fee liquid withdrawals up to a certain amount.