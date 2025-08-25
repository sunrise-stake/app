import {
  forwardRef,
  useEffect,
  type ForwardRefRenderFunction,
  useState,
} from "react";
import AccountBalance from "./AccountBalance";
import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { type Details } from "@sunrisestake/client";
import BN from "bn.js";
import { lamportsToDisplay } from "../common/utils";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

const _YieldApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const {
    details,
  }: {
    details: Details | undefined;
  } = useSunriseStake();

  const [yieldRouterBalance, setYieldRouterBalance] = useState(0);
  const [offsetBridgeBalance, setOffsetBridgeBalance] = useState(0);

  const { connection } = useConnection();

  useEffect(() => {
    const getBalances = async (): Promise<void> => {
      const yieldControllerBal = await connection.getBalance(
        new PublicKey("6HQrvpMJFqMj35JqMReyhnUrRXNucAAB6FywdDu7xPKA")
      );
      const offsetBridgeBal = await connection.getBalance(
        new PublicKey("4XTLzYF3kteTbb3a9NYYjeDAYwNoEGSkjoqJYkiLCnmm")
      );

      setYieldRouterBalance(yieldControllerBal);
      setOffsetBridgeBalance(offsetBridgeBal);
    };

    getBalances().catch(console.error);
  }, [connection]);

  if (details == null) return <>Loading...</>;

  const extractableYield = new BN(
    Math.max(details.extractableYield.toNumber(), 0)
  );

  return (
    <div className="flex flex-col justify-start w-full mt-16">
      <AccountBalance
        title="Sunrise Stake"
        balance={lamportsToDisplay(extractableYield)}
      />
      <AccountBalance
        title="Yield Router"
        balance={lamportsToDisplay(new BN(yieldRouterBalance))}
      />
      <div className="flex justify-center gap-16">
        <div className="flex flex-col">
          <AccountBalance title="Eco Token Escrow" balance="x" />
          <AccountBalance title="Eco Token" balance="x" />
        </div>
        <AccountBalance
          title="Offset Bridge"
          balance={lamportsToDisplay(new BN(offsetBridgeBalance))}
        />
      </div>
    </div>
  );
};

const YieldApp = forwardRef(_YieldApp);

export { YieldApp };
