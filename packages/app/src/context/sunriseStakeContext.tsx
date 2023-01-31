import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { SunriseClientWrapper } from "../lib/sunriseClientWrapper";
import { Keypair } from "@solana/web3.js";
import { Details } from "@sunrisestake/client";

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

export const SunriseProvider: FC<{ children: ReactNode }> = ({ children }) => {
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
    },
    [setClient]
  );

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
        .then(setDetails)
        .catch(console.error);
    }
  }, [connection, wallet?.publicKey?.toBase58()]);

  return (
    <SunriseContext.Provider value={{ client, details }}>
      {children}
    </SunriseContext.Provider>
  );
};

export const useSunriseStake = (): SunriseContextProps =>
  useContext(SunriseContext);
