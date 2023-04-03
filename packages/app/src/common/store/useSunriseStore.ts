import { type WalletContextState } from "@solana/wallet-adapter-react";
import { type BuyAndBurnState } from "@sunrisestake/yield-controller";
import isEqual from "react-fast-compare";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { getYieldState } from "../api/yieldState";

import { DEFAULT_CONTEXT } from "../constants";

interface SunriseStore {
  yieldState: BuyAndBurnState | null;
  fetchYieldState: () => Promise<void>;
  wallet: WalletContextState;
  updateWallet: (wallet: WalletContextState) => void;
}

const useSunriseStore = create<SunriseStore>()(
  immer(
    devtools((set) => ({
      yieldState: null,
      fetchYieldState: async () => {
        const yieldState = await getYieldState();
        set((state) => {
          if (!isEqual(yieldState, state.yieldState))
            state.yieldState = yieldState;
        });
      },
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
