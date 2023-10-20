import { type FC } from "react";
import WaterBowl from "./WaterBowl";

interface AccountBalanceProps {
  title: string;
  balance: string;
}
const AccountBalance: FC<AccountBalanceProps> = ({ title, balance }) => {
  return (
    <div className="flex gap-2 my-8 justify-center">
      <div className="text-2xl font-bold w-40">{title}</div>
      <div className="flex flex-col items-center">
        <WaterBowl />
        <div className="text-lg">{balance} Sol</div>
      </div>
    </div>
  );
};

export default AccountBalance;
