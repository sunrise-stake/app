import {FC, FormEvent, useCallback, useEffect, useState} from "react";
import {useGreenStake} from "../hooks/useGreenStake";
import BN from "bn.js";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {toSol} from "../lib/util";
import {LAMPORTS_PER_SOL, TokenAmount} from "@solana/web3.js";
import {BalanceInfo} from "../lib/greenStake";

// TODO TEMP lookup
const SOL_PRICE_USD_CENTS = 3300
const CARBON_PRICE_USD_CENTS_PER_TONNE = 8021

const solToCarbon = (sol: number) => sol * SOL_PRICE_USD_CENTS / CARBON_PRICE_USD_CENTS_PER_TONNE

export const GreenStake:FC = () => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const client = useGreenStake();
    const [txSig, setTxSig] = useState<string>();
    const [error, setError] = useState<Error>();
    const [solBalance, setSolBalance] = useState<number>();
    const [stakeBalance, setStakeBalance] = useState<BalanceInfo>();
    const [treasuryBalanceLamports, setTreasuryBalanceLamports] = useState<number>();

    const updateBalances = useCallback(async () => {
        if (!wallet.publicKey || !client) return;
        setSolBalance(await connection.getBalance(wallet.publicKey));
        setStakeBalance(await client.getBalance());
        setTreasuryBalanceLamports(await client.treasuryBalance());
    }, [wallet.publicKey, client, connection]);

    useEffect(() => {
        if (!wallet || !wallet.connected || !wallet.publicKey) return;
        updateBalances();
    }, [wallet, connection, setSolBalance, client]);

    const deposit = useCallback((e: FormEvent) => {
        e.preventDefault()
        if (!client) return;
        const target = e.target as typeof e.target & { amount: { value: number } };

        client.deposit(new BN(target.amount.value).mul(new BN(LAMPORTS_PER_SOL)))
            .then(setTxSig)
            .then(updateBalances)
            .catch(setError);
    }, [client]);

    const withdraw = useCallback((e: FormEvent) => {
        e.preventDefault()
        if (!client) return;
        client.withdraw()
            .then(setTxSig)
            .then(updateBalances)
            .catch(setError);
    }, [client]);

    return <div>
        {!client && <div>Loading...</div>}
        {solBalance && <div>Available balance to deposit: {toSol(solBalance)} ◎</div>}
        {stakeBalance &&
            <>
                <div>Deposited SOL: {stakeBalance.depositedSol.uiAmountString} ◎</div>
                <div>mSOL: {stakeBalance.msolBalance.uiAmountString}</div>
                <div>Earned: {toSol(stakeBalance.earnedLamports)} ◎</div>
                <div>Your tCO₂E : {solToCarbon(toSol(stakeBalance.earnedLamports))}</div>
            </>
        }
        {treasuryBalanceLamports &&
            <div>Total tCO₂E: {solToCarbon(toSol(treasuryBalanceLamports))}</div>
        }
        <form onSubmit={deposit}>
            <input name="amount" type="number" placeholder="Amount"/>
            <input type="submit" value="Deposit"/>
        </form>
        <form onSubmit={withdraw}>
            <input name="amount" type="number" placeholder="Amount"/>
            <input type="submit" value="Withdraw"/>
        </form>
        {txSig && <div>Done! {txSig}</div>}
        {error && <div>Error! {error.message}</div>}
    </div>
}