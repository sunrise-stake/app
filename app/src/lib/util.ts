import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {WalletContextState} from "@solana/wallet-adapter-react";
import BN from "bn.js";

export const toSol = (lamports: number):number => Math.floor((lamports / LAMPORTS_PER_SOL) * 100) / 100

export const walletIsConnected = (wallet: WalletContextState): wallet is ConnectedWallet => wallet.connected && !!wallet.publicKey;

export type ConnectedWallet = WalletContextState & { publicKey: PublicKey }