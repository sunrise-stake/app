import { useEffect, useState } from "react";
import { toBN, ZERO } from "../utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type BN from "bn.js";

export const useSolBalance = (): BN => {
  const [solBalance, setSolBalance] = useState(ZERO);
  const { connection } = useConnection();
  const wallet = useWallet();
  useEffect(() => {
    if (wallet?.publicKey) {
      connection
        .getBalance(wallet.publicKey)
        .then(toBN)
        .then(setSolBalance)
        .catch(console.error);

      const subscription = connection.onAccountChange(
        wallet.publicKey,
        (info) => {
          setSolBalance(toBN(info.lamports));
        }
      );

      return () => {
        connection
          .removeAccountChangeListener(subscription)
          .catch(console.error);
      };
    }
  }, [wallet.publicKey]);

  return solBalance;
};
