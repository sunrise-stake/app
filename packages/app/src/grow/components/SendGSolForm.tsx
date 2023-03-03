import clx from "classnames";
import { useState, type FC } from "react";
import { AmountInput, Button, Spinner } from "../../common/components";
import { GiPresent } from "react-icons/gi";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { handleError, solToLamports, ZERO } from "../../common/utils";
import { type Details } from "@sunrisestake/client";
import { useSunriseStake } from "../../common/context/sunriseStakeContext";
import BN from "bn.js";
import {
  NotificationType,
  notifyTransaction,
} from "../../common/components/notifications";
import { type Charity } from "../GrowApp";

interface Props {
  charity?: Charity;
  recipient: string;
  setRecipient: (recipient: string) => void;
  className?: string;
}

const SendGSolForm: FC<Props> = ({
  className,
  charity,
  recipient,
  setRecipient,
}) => {
  const [amount, setAmount] = useState("");

  const [isBusy, setIsBusy] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const {
    details,
  }: {
    details: Details | undefined;
  } = useSunriseStake();

  const { publicKey: senderPubkey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const transferGSol = async (): Promise<void> => {
    if (!senderPubkey || !details) {
      return;
    }

    let recipientPubkey;
    try {
      recipientPubkey = new PublicKey(recipient);
    } catch (e) {
      handleError(e as Error);
      console.log(e);
      return;
    }
    const mint = new PublicKey(details.sunriseStakeConfig.gsolMint);

    const transaction = new Transaction();
    const associatedTokenFrom = await getAssociatedTokenAddress(
      mint,
      senderPubkey
    );
    const fromAccount = await getAccount(connection, associatedTokenFrom);

    const associatedTokenTo = await getAssociatedTokenAddress(
      mint,
      recipientPubkey
    );

    if (!(await connection.getAccountInfo(associatedTokenTo))) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderPubkey,
          associatedTokenTo,
          recipientPubkey,
          mint
        )
      );
    }

    transaction.add(
      createTransferInstruction(
        fromAccount.address,
        associatedTokenTo,
        senderPubkey,
        solToLamports(amount).toNumber()
      )
    );
    const signature = sendTransaction(transaction, connection)
      .then((tx) => {
        notifyTransaction({
          type: NotificationType.success,
          message: "Transfer successful",
          txid: tx,
        });
      })
      .catch(handleError);
    console.log("Transfer signature:", signature);
  };

  return (
    <div
      className={clx(
        "bg-inset bg-opacity-10 backdrop-blur-sm px-8 py-4 rounded-md",
        className
      )}
    >
      <div className="flex flex-col">
        <div className="font-semibold text-xl mb-2">
          To{" "}
          <span className="font-normal text-lg text-green">
            {charity?.name}
          </span>
        </div>
        <input
          className="mb-4 rounded-md text-sm xl:text-lg py-3 px-4 placeholder:text-sm"
          onChange={(e) => {
            setRecipient(e.target.value);
          }}
          value={recipient}
          placeholder="Address"
        />
        <div className="font-semibold text-xl mb-2">Send gSOL</div>
        <div className="flex items-center gap-4">
          <AmountInput
            className="basis-3/4"
            token="gSOL"
            balance={new BN(details?.balances.gsolBalance.amount ?? ZERO)}
            amount={amount}
            setAmount={setAmount}
            setValid={setIsValid}
            mode="UNSTAKE"
            variant="small"
          />

          <Button
            className="basis-1/4"
            onClick={() => {
              setIsBusy(true);
              transferGSol().finally(() => {
                setIsBusy(false);
              });
            }}
            disabled={isBusy || !isValid}
            size="sm"
          >
            <div className="flex gap-2 w-full justify-center items-center">
              {isBusy ? (
                <Spinner size="1rem" className="mr-1" />
              ) : (
                <GiPresent size={32} />
              )}
              Send
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export { SendGSolForm };
