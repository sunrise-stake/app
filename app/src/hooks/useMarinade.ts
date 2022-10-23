import {useMemo} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {MarinadeClient} from "../lib/marinade";
import {walletIsConnected} from "../lib/util";

export const useMarinade = ():MarinadeClient | undefined => {
    const wallet = useWallet();
    const { connection } = useConnection()
    return useMemo(() => {
        if (walletIsConnected(wallet)) {
            return new MarinadeClient(connection, wallet);
        }
    }, [wallet, connection]);
}