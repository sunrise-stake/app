import {FC, FormEvent, useCallback, useEffect, useState} from "react";
import {useGreenStake, useReadOnlyGreenStake} from "../hooks/useGreenStake";
import BN from "bn.js";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {toSol} from "../lib/util";
import {LAMPORTS_PER_SOL, TokenAmount} from "@solana/web3.js";
import {BalanceInfo} from "../lib/greenStake";

// TODO remove duplication with greenStake

// TODO TEMP lookup
const SOL_PRICE_USD_CENTS = 3300
const CARBON_PRICE_USD_CENTS_PER_TONNE = 8021

const solToCarbon = (sol: number) => sol * SOL_PRICE_USD_CENTS / CARBON_PRICE_USD_CENTS_PER_TONNE

export const GreenStakeWelcome:FC = () => {
    const { connection } = useConnection();
    const client = useReadOnlyGreenStake();
    const [treasuryBalanceLamports, setTreasuryBalanceLamports] = useState<number>();

    const updateBalances = useCallback(async () => {
        if (!client) return;
        setTreasuryBalanceLamports(await client.treasuryBalance());
    }, [client, connection]);

    useEffect(() => {
        if (!client) return;
        updateBalances();
    }, [connection, client]);

    return <div className="flex">
        {!client && <div>Loading...</div>}
        {treasuryBalanceLamports && <>
            <div className="flex-auto">Total carbon recovered</div>
            <div>{solToCarbon(toSol(treasuryBalanceLamports)).toFixed(2)} tCO₂E</div>
        </>
        }
    </div>
}