import React, { FC } from "react";
import { BalanceInfo } from "../lib/stakeAccount";
import { toFixedWithPrecision, toSol } from "../lib/util";
import BN from "bn.js";
import { TicketAccount } from "../lib/client/types/TicketAccount";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface BalanceInfoProps {
  solBalance?: BN;
  stakeBalance?: BalanceInfo;
  treasuryBalanceLamports?: BN;
  delayedUnstakeTickets: TicketAccount[];
  redeem: (ticket: TicketAccount) => void;
}

// TODO TEMP lookup
export const SOL_PRICE_USD_CENTS = 3300;
export const CARBON_PRICE_USD_CENTS_PER_TONNE = 8021;

export const solToCarbon = (sol: number): number =>
  (sol * SOL_PRICE_USD_CENTS) / CARBON_PRICE_USD_CENTS_PER_TONNE;

const BalanceInfoTable: FC<BalanceInfoProps> = ({
  solBalance,
  stakeBalance,
  treasuryBalanceLamports,
  delayedUnstakeTickets,
  redeem,
}) => {
  return solBalance !== undefined ? (
    <div className="w-96 bg-neutral-700 rounded-lg px-4 py-2 flex flex-col">
      {delayedUnstakeTickets.length > 0 && (
        <div className="flex flex-col">
          {delayedUnstakeTickets.map((ticket) => (
            <div
              key={ticket.address.toBase58()}
              className="flex justify-start items-center mb-2"
            >
              <img
                src={"./ticket.png"}
                alt="Ticket"
                style={{ height: "1.6rem", marginRight: "1rem" }}
              />
              <div>
                <h4 className="text-xl text-neutral-400">
                  {toFixedWithPrecision(toSol(ticket.lamportsAmount))} ◎
                </h4>
                <h4 className="text-sm text-neutral-400">Ticket</h4>
              </div>
              <div className="ml-auto">
                {
                  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                  ticket.ticketDue ? (
                    <h4 className="text-sm text-neutral-400">
                      <button
                        type="submit"
                        className="inline-block py-1 px-5 ml-3 border-2 rounded-md border-green text-green font-medium text-sm leading-tight uppercase hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out active:bg-[#5A9370] active:text-slate-800"
                        onClick={() => redeem(ticket)}
                      >
                        Redeem
                      </button>
                    </h4>
                  ) : (
                    <h4 className="text-sm text-neutral-400">
                      Due{" "}
                      {ticket.ticketDueDate
                        ? dayjs(ticket.ticketDueDate).fromNow()
                        : ""}
                    </h4>
                  )
                }
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-start items-center mb-2">
        <img
          src={"./solana-logo.png"}
          alt="Solana Logo"
          style={{ height: "1.6rem", marginRight: "1rem" }}
        />
        <div>
          <h4 className="text-xl text-neutral-400">
            {toFixedWithPrecision(toSol(solBalance))} ◎
          </h4>
          <h4 className="text-sm text-neutral-400">Available Balance</h4>
        </div>
      </div>
      {stakeBalance != null && (
        <div>
          <div className="flex justify-start items-center">
            <img
              src={"./solana-logo.png"}
              alt="Solana Logo"
              style={{ height: "1.6rem", marginRight: "1rem" }}
            />
            <div>
              <h4 className="text-xl text-neutral-400">
                {stakeBalance.gsolBalance.uiAmountString} ◎
              </h4>
              <h4 className="text-sm text-neutral-400">Deposited SOL</h4>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center my-2 ">
              <img
                src={"./mSOL.png"}
                alt="Solana Logo"
                style={{ height: "1.5rem", marginRight: "1rem" }}
              />
              <h4 className="text-xl text-neutral-400">
                {toFixedWithPrecision(stakeBalance.msolBalance.uiAmount ?? 0)}
              </h4>
              <h4 className="text-sm text-neutral-400 mx-2">mSOL</h4>
            </div>
            <div className="flex flex-row justify-between">
              <div>
                <h4 className="text-xl text-neutral-400">
                  {toFixedWithPrecision(toSol(stakeBalance.earnedLamports))}
                </h4>
                <h4 className="text-sm text-neutral-400">Earned</h4>
              </div>
              <div>
                <h4 className="text-xl text-neutral-400">
                  {toFixedWithPrecision(
                    solToCarbon(toSol(stakeBalance.earnedLamports))
                  )}
                </h4>
                <h4 className="text-sm text-neutral-400">tCO₂E </h4>
              </div>
              {treasuryBalanceLamports !== undefined && (
                <div>
                  <h4 className="text-xl bold text-neutral-400">
                    {toFixedWithPrecision(
                      solToCarbon(toSol(treasuryBalanceLamports))
                    )}
                  </h4>
                  <h4 className="text-sm text-neutral-400">Total tCO₂E </h4>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <></>
  );
};

export default BalanceInfoTable;
