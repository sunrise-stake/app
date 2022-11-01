import {useEffect, useMemo, useState} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {GreenStake} from "../lib/greenStake";
import {ConnectedWallet, walletIsConnected} from "../lib/util";
import {Keypair, PublicKey} from "@solana/web3.js";

export const useGreenStake = ():GreenStake | undefined => {
    const wallet = useWallet();
    const { connection } = useConnection()
    const [greenStake, setGreenStake] = useState<GreenStake>()
    useEffect(() => {
        if (walletIsConnected(wallet)) {
            GreenStake.init(connection, wallet).then(setGreenStake);
        }
    }, [wallet, connection]);

    return greenStake;
}

const dummyKey = Keypair.generate().publicKey
export const useReadOnlyGreenStake = (): GreenStake | undefined => {
    const { connection } = useConnection()
    const [greenStake, setGreenStake] = useState<GreenStake>()

    useEffect(() => {
        GreenStake.init(connection, {
            publicKey: dummyKey,
            signAllTransactions: async (txes) => txes,
            signTransaction: async (tx) => tx
        } as ConnectedWallet).then(setGreenStake);
    }, [connection]);

    return greenStake;
}