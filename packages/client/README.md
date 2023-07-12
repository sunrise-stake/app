# Sunrise Stake Client

A client library for the [Sunrise Stake](https://sunrisestake.com) Solana programs.

## What is Sunrise Stake?

Sunrise Stake is a climate-positive staking platform on Solana, that allows you to stake your SOL
and redirects staking yield to offset your carbon footprint.

For more details, visit [sunrisestake.com](https://sunrisestake.com).

To stake, visit the [app](https://app.sunrisestake.com).

## Quick Start

```shell
yarn add @sunrisestake/client
```

Usage in a browser (React app):

```typescript
import { SunriseStakeClient } from '@sunrisestake/client';
import { AnchorProvider } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

// inside your app
const connection = useConnection()
const anchorWallet = useAnchorWallet()
const anchorProvider = new AnchorProvider(connection, anchorWallet, {});
const client = SunriseStakeClient.get(provider, 'mainnet-beta');
```

Usage in Node:

```typescript
import { SunriseStakeClient } from '@sunrisestake/client';
import { Connection } from "@solana/web3.js";

const connection = new Connection(/* mainnet RPC endpoint */);
const provider = AnchorProvider.env();
const client = SunriseStakeClient.get(provider, 'mainnet-beta');
```

## Usage

### Details

Almost all information is available via the details() function

```
const details = await client.details()

// user's current staked balance
details.balances.gsolBalance

// total staked balance
details.balances.gsolSupply

// amount of gsol a user has locked
details.lockDetails.amountLocked

// if a user has an impact NFT, this is the mint address
details.impactNFTDetails.mint
```

### Staking

Stake SOL to receive gSOL

```typescript
await client.sendAndConfirmTransaction(
    client.deposit(amountInLamports)
);
```

### Unstaking

Unstake gSOL to receive SOL back

```typescript
await client.sendAndConfirmTransaction(
    await client.unstake(amountInLamports)
);
```

### Advanced Usage

For more advanced usage view the test files in the [source code](https://github.com/sunrise-stake/app).
