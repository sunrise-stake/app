import { type WalletContextState } from "@solana/wallet-adapter-react";
import isEqual from "react-fast-compare";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { DEFAULT_CONTEXT } from "../constants";

interface SunriseStore {
  wallet: WalletContextState;
  updateWallet: (wallet: WalletContextState) => void;
}

const useSunriseStore = create<SunriseStore>()(
  immer(
    devtools((set) => ({
      wallet: DEFAULT_CONTEXT,
      updateWallet: (wallet) => {
        set((state) => {
          if (!isEqual(wallet, state.wallet))
            (state.wallet as WalletContextState) = wallet;
        });
      },
    }))
  )
);

export { useSunriseStore };
