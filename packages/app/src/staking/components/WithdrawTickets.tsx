import { TicketIcon } from "@heroicons/react/24/solid";
import { toSol, type TicketAccount } from "@sunrisestake/client";
import clx from "classnames";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { useState, useEffect, useMemo } from "react";
import { AiOutlineClockCircle } from "react-icons/ai";

import { toFixedWithPrecision } from "../../common/utils";
import { Button, Spinner } from "../../common/components";

dayjs.extend(relativeTime);

interface WithdrawTicketProps {
  ticket: TicketAccount;
  redeem: (ticket: TicketAccount) => Promise<any>;
}

const WithdrawTicket: React.FC<WithdrawTicketProps> = ({ ticket, redeem }) => {
  const [isClicked, setIsClicked] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (isClicked) {
      const timeout = setTimeout(() => {
        setIsClicked(false);
      }, 5000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isClicked]);

  const ticketDue = useMemo(
    () =>
      ticket.ticketDue !== undefined &&
      ticket.ticketDue !== null &&
      ticket.ticketDue,
    [ticket]
  );

  return (
    <div className="flex flex-row sm:justify-center sm:items-center">
      <Button
        color={ticketDue ? "primary" : "ticket"}
        className="relative z-10 h-16 min-w-[10rem] sm:min-w-[12rem] items-center"
        onClick={() => {
          if (!ticketDue) {
            console.log("Ticket is not due yet");
            setIsClicked((prevState) => !prevState);
            return;
          }
          setIsBusy(true);
          redeem(ticket).finally(() => {
            setIsBusy(false);
          });
        }}
      >
        <div className="flex flex-row items-center">
          {!isBusy ? (
            <TicketIcon width={44} className="sm:ml-0 sm:mr-4 px-2 rounded" />
          ) : (
            <Spinner className="sm:ml-0 sm:mr-5 px-2 rounded" />
          )}
          <div className="text-lg ml-2 -mr-2 sm:mr-0 ">
            <span className="font-bold text-sm sm:text-lg">
              {" "}
              {toFixedWithPrecision(toSol(ticket.lamportsAmount))}
            </span>{" "}
            <span className="text-xs font-bold">SOL</span>
          </div>
        </div>
      </Button>

      <Button
        onClick={() => {
          setIsClicked(false);
        }}
        color="secondary"
        className={clx(
          "text-danger border border-danger text-sm absolute items-center transition-transform duration-500 z-0 h-16 max-w-[10rem] sm:max-w-[12rem]",
          {
            "transform translate-x-[11rem] sm:translate-x-[14rem]": isClicked,
            "transform translate-x-0": !isClicked,
          }
        )}
      >
        <div className="flex flex-row items-center truncate overflow-hidden -mx-4">
          <AiOutlineClockCircle className="hidden sm:block mr-2" />
          <div className="text-sm">
            Due {dayjs(ticket.ticketDueDate).fromNow()}
          </div>
        </div>
      </Button>
    </div>
  );
};

export { WithdrawTicket };
