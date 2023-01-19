import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SunriseClientWrapper } from "../lib/sunriseClientWrapper";
import { walletIsConnected } from "../lib/util";
import { Keypair } from "@solana/web3.js";
import { Details } from "../lib/client/types/Details";

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
  const wallet = useWallet();

  const updateClient = useCallback(
    async (client: SunriseClientWrapper) => {
      setClient(client);
      setDetails(await client.getDetails());
    },
    [setClient]
  );

  useEffect(() => {
    if (walletIsConnected(wallet)) {
      console.log("wallet connected");
      SunriseClientWrapper.init(connection, wallet, setDetails)
        .then(updateClient)
        .catch(console.error);
    } else {
      console.log("wallet not connected");
      SunriseClientWrapper.init(
        connection,
        {
          connected: true,
          publicKey: dummyKey,
          signAllTransactions: async (txes) => txes,
          signTransaction: async (tx) => tx,
        },
        setDetails
      )
        .then(updateClient)
        .catch(console.error);
    }
  }, [connection, wallet.connected, wallet.publicKey?.toBase58()]);

  return (
    <SunriseContext.Provider value={{ client, details }}>
      {children}
    </SunriseContext.Provider>
  );
};

export const useSunriseStake = (): SunriseContextProps =>
  useContext(SunriseContext);
