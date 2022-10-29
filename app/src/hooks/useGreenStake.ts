import {useEffect, useMemo, useState} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {GreenStake} from "../lib/greenStake";
import {walletIsConnected} from "../lib/util";

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