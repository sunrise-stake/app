import React, { type FC, useCallback, useState } from "react";

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
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { NotificationType, notifyTransaction } from "../notifications";

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

  const { details } = useSunriseStake();
  const { publicKey: senderPubkey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [recipient, setRecipient] = useState(recipientFromProps);

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
  }, [recipient, amount, senderPubkey, details, connection, sendTransaction]);

  return (
    <BaseModal {...props} showActions={false}>
      <div
        className={clx(
          "bg-inset bg-opacity-10 backdrop-blur-sm px-8 py-4 rounded-md",
          className
        )}
      >
        <div className="flex flex-col">
          <div className="font-semibold text-xl mb-2">
            To{" "}
            {recipientFromProps && (
              <a
                className="font-normal text-lg text-green"
                href={recipient?.website}
                target="_blank"
                rel="noreferrer"
              >
                {recipient?.name ??
                  (recipient?.address && toShortBase58(recipient.address))}
              </a>
            )}
          </div>
          {!recipientFromProps && (
            <input
              className="mb-4 rounded-md text-sm xl:text-lg py-3 px-4 placeholder:text-sm"
              onChange={(e) => {
                updateRecipientFromForm(e.target.value);
              }}
              defaultValue={recipient?.address?.toBase58() ?? ""}
              placeholder="Address"
            />
          )}
          <div className="font-semibold text-xl mb-2">Send gSOL</div>
          <div className="flex items-center gap-4">
            <AmountInput
              className="basis-3/4"
              token="gSOL"
              balance={new BN(details?.balances.gsolBalance.amount ?? ZERO)}
              amount={amount}
              setAmount={setAmount}
              setValid={setIsValid}
              mode="TRANSFER"
              variant="small"
            />

            <Button
              className="basis-1/4"
              onClick={() => {
                setIsBusy(true);
                transferGSol().finally(() => {
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
    </BaseModal>
  );
};

export { SendGSolModal };
