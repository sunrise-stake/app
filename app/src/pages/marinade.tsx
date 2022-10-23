import {FC, FormEvent, useCallback, useEffect, useState} from "react";
import {useMarinade} from "../hooks/useMarinade";
import BN from "bn.js";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {toSol} from "../lib/util";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";

export const Marinade:FC = () => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const marinade = useMarinade();
    const [txSig, setTxSig] = useState<string>();
    const [error, setError] = useState<Error>();
    const [solBalance, setSolBalance] = useState<number>();
    const [msolBalance, setMSolBalance] = useState<number>();

    const updateBalances = useCallback(async () => {
        if (!wallet.publicKey || !marinade) return;
        setSolBalance(await connection.getBalance(wallet.publicKey));
        setMSolBalance(await marinade.getBalance().then(bn => bn.toNumber()));
    }, [wallet.publicKey, marinade, connection]);

    useEffect(() => {
        if (!wallet || !wallet.connected || !wallet.publicKey) return;
        updateBalances();
    }, [wallet, connection, setSolBalance]);

    const deposit = useCallback((e: FormEvent) => {
        e.preventDefault()
        if (!marinade) return;
        const target = e.target as typeof e.target & { amount: { value: number } };

        marinade.deposit(new BN(target.amount.value).mul(new BN(LAMPORTS_PER_SOL)))
            .then(setTxSig)
            .then(updateBalances)
            .catch(setError);
    }, [marinade]);

    const withdraw = useCallback((e: FormEvent) => {
        e.preventDefault()
        if (!marinade) return;
        const target = e.target as typeof e.target & { amount: { value: number } };

        marinade.withdraw(new BN(target.amount.value).mul(new BN(LAMPORTS_PER_SOL)))
            .then(setTxSig)
            .then(updateBalances)
            .catch(setError);
    }, [marinade]);

    return <div>
        <h1>Marinade</h1>
        {!marinade && <div>Loading...</div>}
        {solBalance && <div>Available balance to deposit: {toSol(solBalance)} ◎</div>}
        {msolBalance && <div>Deposited SOL: {toSol(msolBalance)} ◎</div>}
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