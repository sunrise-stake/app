import clx from "classnames";
import { useCallback, useState, type FC } from "react";
import { Button, Spinner } from "../../common/components";
import { GiPresent } from "react-icons/gi";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { solToLamports } from "../../common/utils";
import { type Details } from "@sunrisestake/client";
import { useSunriseStake } from "../../common/context/sunriseStakeContext";

interface Props {
  className?: string;
}

const SendGSolForm: FC<Props> = ({ className }) => {
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const {
    details,
  }: {
    details: Details | undefined;
  } = useSunriseStake();

  const { publicKey: senderPubkey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  console.log("Connection:", connection);
  console.log("Sender:", senderPubkey?.toBase58());

  const transferGSol = useCallback(async () => {
    if (!senderPubkey || !details) {
      return;
    }
    const recipientPubkey = new PublicKey(recipientAddress);
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
    const signature = await sendTransaction(transaction, connection);
    console.log("Transfer signature:", signature);
  }, [recipientAddress]);

  return (
    <div
      className={clx(
        "bg-gray-300 backdrop-blur-sm px-8 py-4 rounded-md w-full sm:w-[50%]",
        className
      )}
    >
      <div className="flex flex-col">
        <div className="font-semibold text-xl">Send</div>
        <input
          onChange={(e) => {
            setAmount(e.target.value);
          }}
          value={amount}
        />
        <div className="font-semibold text-xl">To</div>
        <input
          className="mb-4"
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
          disabled={isBusy}
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
