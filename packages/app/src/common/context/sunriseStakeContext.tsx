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
import { safeParsePublicKeyFromUrl } from "../utils";

interface SunriseContextProps {
  client: SunriseClientWrapper | undefined;
  details: Details | undefined;
  loading: boolean;
}
const defaultValue: SunriseContextProps = {
  client: undefined,
  details: undefined,
  loading: false,
};
const SunriseContext = createContext<SunriseContextProps>(defaultValue);

// pass into anchor when the wallet is not yet connected
const dummyKey = Keypair.generate().publicKey;

const SunriseProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<SunriseClientWrapper>();
  const [details, setDetails] = useState<Details>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const updateClient = async (
    clientToUpdate: SunriseClientWrapper
  ): Promise<void> => {
    // don't overwrite a readwrite client with a readonly one
    if (clientToUpdate.readonlyWallet && client) return;

    console.log("setting client: readonly", clientToUpdate.readonlyWallet);
    setClient(clientToUpdate);
    setDetails(await clientToUpdate.getDetails());

    window.client = clientToUpdate;
  };

  // Use this to initialise the details if it is not already set
  // this prevents the details from being overwritten by the readonly client
  const initDetails = (newDetails: Details): void => {
    setDetails((existingDetails) => existingDetails ?? newDetails);
  };

  useEffect(() => {
    const addressFromUrl = safeParsePublicKeyFromUrl();
    if (wallet) {
      SunriseClientWrapper.init(
        connection,
        wallet,
        setDetails,
        undefined,
        setLoading
      )
        .then(updateClient)
        .catch((error) => {
          console.error(
            "Failed to initialize SunriseClient for wallet:",
            error
          );
          setLoading(false);
        });
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
        undefined,
        true
      )
        .then(updateClient)
        .catch((e) => {
          console.error("Failed to initialize readonly client:", e);
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
        undefined,
        true
      )
        .then(async (client) => {
          console.log("getting details");
          return client.getDetails();
        })
        .then(initDetails)
        .catch((error) => {
          console.error("Failed to get initial details:", error);
        });
    }
  }, [wallet?.publicKey, location.state?.address]);

  return (
    <SunriseContext.Provider value={{ client, details, loading }}>
      {children}
    </SunriseContext.Provider>
  );
};

const useSunriseStake = (): SunriseContextProps => useContext(SunriseContext);

export { SunriseProvider, useSunriseStake };
