import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { SignerWalletAdapterProps } from '@solana/wallet-adapter-base'
import BN from 'bn.js'

export const toSol = (lamports: number | BN): number => new BN(lamports).toNumber() / LAMPORTS_PER_SOL

export const walletIsConnected = (wallet: SparseWalletContextAdapter): wallet is ConnectedWallet => wallet.connected && (wallet.publicKey != null)

const MAX_NUM_PRECISION = 5
// Get the number of decimal places to show in a formatted number
// Min = 0, Max = MAX_NUM_PRECISION
const formatPrecision = (n: number): number =>
  Math.min(
    Math.abs(
      Math.min(0,
        Math.ceil(
          Math.log(n) / Math.log(10)
        )
      )
    ) + 1, MAX_NUM_PRECISION)
export const toFixedWithPrecision = (n: number): string => n.toFixed(formatPrecision(n))

interface SparseWallet {
  publicKey: PublicKey
  signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined
  signAllTransactions: SignerWalletAdapterProps['signAllTransactions'] | undefined
}

type SparseWalletContextAdapter = Omit<SparseWallet, 'publicKey'> & { publicKey: PublicKey | null, connected: boolean }

export type ConnectedWallet = SparseWallet & { connected: true }
