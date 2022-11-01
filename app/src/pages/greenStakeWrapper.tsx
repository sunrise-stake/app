import React, {FC} from "react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {GreenStake} from "./greenStake";
import {useWallet} from "@solana/wallet-adapter-react";
import {GreenStakeWelcome} from "./greenStakeWelcome";
import logo from './logo-trimmed-removebg-preview.png';

export const GreenStakeWrapper:FC = () => {
    const wallet = useWallet();
    return (
        <div className="flex min-h-full">
            <div className="flex flex-1 flex-col py-6 px-4 sm:px-6 lg:flex-none lg:px-12 xl:px-16 bg-white/70 items-center rounded-2xl">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div>
                        <img
                            className="h-48 w-auto m-auto pb-4"
                            src={logo}
                            alt="Sunrise"
                        />
                        <WalletMultiButton/>
                    </div>
                    {wallet.connected ? <GreenStake/> : <GreenStakeWelcome/>}
                </div>
            </div>
        </div>
    )
        ;
}