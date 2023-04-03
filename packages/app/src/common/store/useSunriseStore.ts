import { type WalletContextState } from "@solana/wallet-adapter-react";
import { type Details } from "@sunrisestake/client";
import { type BuyAndBurnState } from "@sunrisestake/yield-controller";
import produce from "immer";
import isEqual from "react-fast-compare";
import { type StateCreator, create } from "zustand";
import { devtools } from "zustand/middleware";

import { getYieldState } from "../api/yieldState";

import { DEFAULT_CONTEXT } from "../constants";

const stateChangeLogger =
  <T extends SunriseStore>(config: StateCreator<T>): StateCreator<T> =>
  (set, get, api) =>
    config(
      process.env.NODE_ENV === "development"
        ? (...args) => {
            const prevValue = get();
            set(...args);
            const nextValue = get();
            if (prevValue !== nextValue) {
              console.log(
                `STATE: Action ${JSON.stringify(
                  args
                )} resulted in a state change (prev, current)`,
                prevValue,
                nextValue
              );
            }
          }
        : set,
      get,
      api
    );

interface SunriseStore {
  details: Details | null;
  yieldState: BuyAndBurnState | null;
  fetchYieldState: () => Promise<void>;
  wallet: WalletContextState;
  updateWallet: (wallet: WalletContextState) => void;
}

const useSunriseStore = create<SunriseStore>()(
  devtools(
    stateChangeLogger((set) => ({
      details: null,
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
  )
);

export { useSunriseStore };
