import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import { type Details } from "@sunrisestake/client";
import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { SunriseClientWrapper } from "../sunriseClientWrapper";
import { useLocation } from "react-router-dom";
import { safeParsePublicKey } from "../utils";
import { type YieldControllerState } from "@sunrisestake/yield-controller";

interface SunriseContextProps {
  client: SunriseClientWrapper | undefined;
  yieldControllerState: YieldControllerState | undefined;
  details: Details | undefined;
}
const defaultValue: SunriseContextProps = {
  client: undefined,
  yieldControllerState: undefined,
  details: undefined,
};
const SunriseContext = createContext<SunriseContextProps>(defaultValue);

// pass into anchor when the wallet is not yet connected
const dummyKey = Keypair.generate().publicKey;

const SunriseProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<SunriseClientWrapper>();
  const [yieldControllerState, setYieldControllerState] =
    useState<YieldControllerState>();
  const [details, setDetails] = useState<Details>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const location = useLocation();

  const updateClient = async (
    clientToUpdate: SunriseClientWrapper
  ): Promise<void> => {
    // don't overwrite a readwrite client with a readonly one
    if (clientToUpdate.readonlyWallet && client) return;

    console.log("setting client: readonly", clientToUpdate.readonlyWallet);
    setClient(clientToUpdate);
    setDetails(await clientToUpdate.debouncedGetDetails());
    setYieldControllerState(clientToUpdate.yieldControllerState);

    window.client = clientToUpdate;
  };

  useEffect(() => {
    console.log("wallet changed", wallet);
    const addressFromUrl = safeParsePublicKey(location.state?.address);
    if (wallet) {
      SunriseClientWrapper.init(connection, wallet, setDetails, undefined)
        .then(updateClient)
        .catch(console.error);
    } else if (addressFromUrl !== null) {
      // we have an address in the url, but no wallet
      // this is a readonly client
      SunriseClientWrapper.init(
        connection,
        {
          publicKey: addressFromUrl,
          signAllTransactions: async (txes) => txes,
          signTransaction: async (tx) => tx,
        },
        undefined,
        undefined,
        true
      )
        .then(updateClient)
        .catch((e) => {
          console.error(e);
        });
    } else {
      // just get the details from the chain - no client available yet
      SunriseClientWrapper.init(
        connection,
        {
          publicKey: dummyKey,
          signAllTransactions: async (txes) => txes,
          signTransaction: async (tx) => tx,
        },
        undefined,
        undefined,
        true
      )
        .then(async (client) => {
          // extract the yield controller state
          setYieldControllerState(client.yieldControllerState);
          //
          // console.log("getting details");
          // return client.debouncedGetDetails();
        })
        // .then(initDetails)
        .catch(console.error);
    }
  }, [wallet?.publicKey, location.state?.address]);

  return (
    <SunriseContext.Provider value={{ client, details, yieldControllerState }}>
      {children}
    </SunriseContext.Provider>
  );
};

const useSunriseStake = (): SunriseContextProps => useContext(SunriseContext);

export { SunriseProvider, useSunriseStake };
