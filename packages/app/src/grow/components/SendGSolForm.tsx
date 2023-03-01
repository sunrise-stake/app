import clx from "classnames";
import { useCallback, useState, type FC } from "react";
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
import { solToLamports, ZERO } from "../../common/utils";
import { type Details } from "@sunrisestake/client";
import { useSunriseStake } from "../../common/context/sunriseStakeContext";
import BN from "bn.js";
import {
  NotificationType,
  notifyTransaction,
} from "../../common/components/notifications";

interface Props {
  className?: string;
}

const SendGSolForm: FC<Props> = ({ className }) => {
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const {
    details,
  }: {
    details: Details | undefined;
  } = useSunriseStake();

  const { publicKey: senderPubkey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  console.log("Connection:", connection);
  console.log("Sender:", senderPubkey?.toBase58());

  const handleError = (error: Error): void => {
    notifyTransaction({
      type: NotificationType.error,
      message: "Transaction failed",
      description: error.message,
    });
    console.error(error);
  };

  const transferGSol = useCallback(async () => {
    if (!senderPubkey || !details) {
      return;
    }
    let recipientPubkey;
    try {
      recipientPubkey = new PublicKey(recipientAddress);
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
        console.log(tx);
      })
      .catch(handleError);
    console.log("Transfer signature:", signature);
  }, [recipientAddress]);

  return (
    <div
      className={clx(
        "bg-inset bg-opacity-10 backdrop-blur-sm px-8 py-4 rounded-md w-full sm:w-[60%] md:w-[40%]",
        className
      )}
    >
      <div className="flex flex-col">
        <div className="font-semibold text-xl mb-2">Send gSOL</div>
        <AmountInput
          className="mb-5"
          token="gSOL"
          balance={new BN(details?.balances.gsolBalance.amount ?? ZERO)}
          amount={amount}
          setAmount={setAmount}
          setValid={setIsValid}
          mode="UNSTAKE"
          variant="small"
        />
        <div className="font-semibold text-xl mb-2">To</div>
        <input
          className="mb-4 rounded-md text-lg py-3 px-4"
          onChange={(e) => {
            setRecipientAddress(e.target.value);
          }}
          value={recipientAddress}
        />
        <Button
          onClick={() => {
            setIsBusy(true);
            transferGSol().finally(() => {
              setIsBusy(false);
            });
          }}
          disabled={isBusy || !isValid}
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
  );
};

export { SendGSolForm };
