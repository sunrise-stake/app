import { SunriseStakeClient } from '../app/src/lib/client/'
import { PublicKey } from '@solana/web3.js'
import './util'
import { AnchorProvider } from '@project-serum/anchor'

const [stateAddress] = process.argv.slice(2);

(async () => {
  const provider = AnchorProvider.env()

  const client = await SunriseStakeClient.get(provider, new PublicKey(stateAddress))
  const txSig = await client.withdraw()

  console.log('Withdraw tx sig: ', txSig)
})().catch(console.error)
