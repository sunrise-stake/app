import { type WalletContextState } from "@solana/wallet-adapter-react";
import { type BuyAndBurnState } from "@sunrisestake/yield-controller";
import produce from "immer";
import isEqual from "react-fast-compare";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { getYieldState } from "../api/yieldState";

import { DEFAULT_CONTEXT } from "../constants";

interface SunriseStore {
  yieldState: BuyAndBurnState | null;
  fetchYieldState: () => Promise<void>;
  wallet: WalletContextState;
  updateWallet: (wallet: WalletContextState) => void;
}

const useSunriseStore = create<SunriseStore>()(
  devtools((set) => ({
    yieldState: null,
    fetchYieldState: async () => {
      const yieldState = await getYieldState();
      set((state) => {
        if (!isEqual(yieldState, state.yieldState))
          return produce(state, (draft) => {
            draft.yieldState = yieldState;
          });
        return state;
      });
    },
    wallet: DEFAULT_CONTEXT,
    updateWallet: (wallet) => {
      set((state) => {
        if (!isEqual(wallet, state.wallet))
          return produce(state, (draft) => {
            (draft.wallet as WalletContextState) = wallet;
          });
        return state;
      });
    },
  }))
);

export { useSunriseStore };
