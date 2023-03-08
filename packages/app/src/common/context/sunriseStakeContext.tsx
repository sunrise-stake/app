import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import { type Details } from "@sunrisestake/client";
import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { SunriseClientWrapper } from "../sunriseClientWrapper";

interface SunriseContextProps {
  client: SunriseClientWrapper | undefined;
  details: Details | undefined;
}
const defaultValue: SunriseContextProps = {
  client: undefined,
  details: undefined,
};
const SunriseContext = createContext<SunriseContextProps>(defaultValue);

// pass into anchor when the wallet is not yet connected
const dummyKey = Keypair.generate().publicKey;

const SunriseProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<SunriseClientWrapper>();
  const [details, setDetails] = useState<Details>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const updateClient = useCallback(
    async (clientToUpdate: SunriseClientWrapper) => {
      // don't overwrite a readwrite client with a readonly one
      if (clientToUpdate.readonlyWallet && client) return;

      console.log("setting client: readonly", clientToUpdate.readonlyWallet);
      setClient(clientToUpdate);
      setDetails(await clientToUpdate.getDetails());

      window.client = clientToUpdate;
    },
    [setClient]
  );

  // Use this to initialise the details if it is not already set
  // this prevents the details from being overwritten by the readonly client
  const initDetails = (newDetails: Details): void => {
    setDetails((existingDetails) => existingDetails ?? newDetails);
  };

  useEffect(() => {
    console.log("wallet changed", wallet);
    if (wallet) {
      SunriseClientWrapper.init(connection, wallet, setDetails)
        .then(updateClient)
        .catch(console.error);
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
        true
      )
        .then(async (client) => {
          console.log("getting details");
          return client.getDetails();
        })
        .then(initDetails)
        .catch(console.error);
    }
  }, [connection, wallet?.publicKey]);

  return (
    <SunriseContext.Provider value={{ client, details }}>
      {children}
    </SunriseContext.Provider>
  );
};

const useSunriseStake = (): SunriseContextProps => useContext(SunriseContext);

export { SunriseProvider, useSunriseStake };
