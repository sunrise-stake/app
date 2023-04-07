import React, { type FC, useCallback, useMemo, useState } from "react";

import { BaseModal, type ModalProps } from "./";
import { PublicKey, Transaction } from "@solana/web3.js";
import clx from "classnames";
import { AmountInput } from "../AmountInput";
import BN from "bn.js";
import { handleError, solToLamports, toShortBase58, ZERO } from "../../utils";
import { Button } from "../Button";
import { Spinner } from "../Spinner";
import { GiPresent } from "react-icons/gi";
import { useSunriseStake } from "../../context/sunriseStakeContext";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { NotificationType, notifyTransaction } from "../notifications";
import { CurrencySelect } from "../CurrencySelect";
import { useSolBalance } from "../../hooks/useSolBalance";

interface SendGSolModalProps {
  recipient?: {
    address: PublicKey;
    name?: string;
    imageUrl?: string;
    website?: string;
  };
  className?: string;
}
const SendGSolModal: FC<ModalProps & SendGSolModalProps> = ({
  className = "",
  recipient: recipientFromProps,
  ...props
}) => {
  const [amount, setAmount] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { details, client } = useSunriseStake();
  const { publicKey: senderPubkey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [recipient, setRecipient] = useState(recipientFromProps);
  const [currency, setCurrency] = useState<"gSOL" | "SOL">("SOL");
  const solBalance = useSolBalance();

  const updateRecipientFromForm = useCallback(
    (addressString: string) => {
      setRecipient({
        address: new PublicKey(addressString),
      });
    },
    [setRecipient]
  );

  const transferGSol = useCallback(async (): Promise<void> => {
    if (!senderPubkey || !details || !recipient) {
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
      recipient.address
    );

    if (!(await connection.getAccountInfo(associatedTokenTo))) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderPubkey,
          associatedTokenTo,
          recipient.address,
          mint
        )
      );
    }

    transaction.add(
      createTransferCheckedInstruction(
        fromAccount.address,
        mint,
        associatedTokenTo,
        senderPubkey,
        solToLamports(amount).toNumber(),
        9
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
  }, [recipient, amount, senderPubkey, details, sendTransaction]);

  const depositGSol = useCallback(async (): Promise<void> => {
    if (!client || !recipient) {
      return;
    }

    const signature = await client
      .deposit(solToLamports(amount), recipient.address)
      .then((txSig) => {
        notifyTransaction({
          type: NotificationType.success,
          message: "Transfer successful",
          txid: txSig,
        });
        return txSig;
      })
      .catch(handleError);
    console.log("Transfer signature:", signature);
  }, [recipient, amount, client, sendTransaction]);

  const send = useCallback(async (): Promise<void> => {
    if (currency === "gSOL") {
      await transferGSol();
    } else {
      await depositGSol();
    }
  }, [currency, transferGSol, depositGSol]);

  const balance = useMemo(() => {
    if (!details) return ZERO;

    if (currency === "gSOL") {
      return new BN(details.balances.gsolBalance.amount);
    } else {
      return solBalance;
    }
  }, [details, currency]);

  return (
    <BaseModal {...props} showActions={false}>
      <div
        className={clx(
          "bg-inset bg-opacity-10 backdrop-blur-sm px-8 py-4 rounded-md",
          className
        )}
      >
        <div className="flex flex-col">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-row">
              <div className="font-semibold text-xl m-2">Send</div>
              <CurrencySelect selected={currency} select={setCurrency} />
            </div>
            <div className="flex flex-row items-center">
              <div className="font-semibold text-xl m-2">To</div>
              {recipientFromProps && (
                <a
                  className="font-normal text-lg text-green py-1 mt-1"
                  href={recipient?.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  {recipient?.name ??
                    (recipient?.address && toShortBase58(recipient.address))}
                </a>
              )}
              {!recipientFromProps && (
                <input
                  className="rounded-md text-sm xl:text-md py-2 px-4 placeholder:text-sm"
                  onChange={(e) => {
                    updateRecipientFromForm(e.target.value);
                  }}
                  defaultValue={recipient?.address?.toBase58() ?? ""}
                  placeholder="Address"
                />
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <AmountInput
              className="w-full"
              token={currency}
              balance={balance}
              amount={amount}
              setAmount={setAmount}
              setValid={setIsValid}
              mode="TRANSFER"
              variant="small"
            />
            <div className="mt-4 float-right">
              <Button
                className="basis-1/4"
                onClick={() => {
                  setIsBusy(true);
                  send().finally(() => {
                    setIsBusy(false);
                    props.ok();
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
      </div>
    </BaseModal>
  );
};

export { SendGSolModal };
