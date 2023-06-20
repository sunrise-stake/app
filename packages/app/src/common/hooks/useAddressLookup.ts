import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { walletNameToAddressAndProfilePicture } from "@portal-payments/solana-wallet-names";

const useAddressLookup = (inputProp: string): any => {
  const { connection } = useConnection();
  const [walletDomainName, setWalletDomainName] = useState("");
  const [resolvedDomain, setResolvedDomain] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [output, setOutput] = useState<{
    resolvedDomain: string | null;
    errorMessage: string | null;
  }>({ resolvedDomain: null, errorMessage: null });

  // Extracting wallet domain name from wallet address
  const extractDomainName = (input: string): string | null => {
    if (input.includes(".")) {
      const parts = input.split(".");
      return parts[parts.length - 2] + "." + parts[parts.length - 1];
    } else return null;
  };

  useEffect(() => {
    const domain = extractDomainName(inputProp);
    domain !== null
      ? setWalletDomainName(domain)
      : setResolvedDomain(inputProp);
  }, [inputProp]);

  useEffect(() => {
    const walletNameSupport = async (): Promise<void> => {
      const walletAddressAndProfilePicture =
        await walletNameToAddressAndProfilePicture(
          connection,
          walletDomainName
        );
      const response: any = walletAddressAndProfilePicture.walletAddress;
      setResolvedDomain(response);
    };

    walletNameSupport().catch((error) => {
      setErrorMessage(error);
    });
  }, [walletDomainName]);

  useEffect(() => {
    setOutput({ resolvedDomain, errorMessage });
  }, [resolvedDomain, errorMessage]);

  return output;
};

export { useAddressLookup };
