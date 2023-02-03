import React, { useState, useEffect } from "react";
import clx from "classnames";
import { Button } from "./Button";
import { TicketIcon } from "@heroicons/react/24/solid";
import { AiOutlineClockCircle } from "react-icons/ai";
import { type TicketAccount } from "@sunrisestake/client";
import { toFixedWithPrecision, toSol } from "../lib/util";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface WithdrawTicketProps {
  ticket: TicketAccount;
  redeem: (ticket: TicketAccount) => void;
}

const WithdrawTicket: React.FC<WithdrawTicketProps> = ({ ticket, redeem }) => {
  const [isClicked, setIsClicked] = useState(false);

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

  // TODO: Think of a better way
  if (ticket.ticketDue === undefined) {
    ticket.ticketDue = false;
  }

  return (
    <div className="flex flex-row sm:justify-center sm:items-center">
      <Button
        variant={ticket.ticketDue ? "primary" : "ticket"}
        className="relative z-10 h-16 min-w-[10rem] sm:min-w-[12rem] items-center"
        onClick={() => {
          if (ticket.ticketDue === undefined || !ticket.ticketDue) {
            console.log("Ticket is not due yet");
            setIsClicked((prevState) => !prevState);
            return;
          }
          redeem(ticket);
        }}
      >
        <div className="flex flex-row items-center">
          <TicketIcon width={44} className="sm:ml-0 sm:mr-4 px-2 rounded" />
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
        variant="secondary"
        className={clx(
          "text-danger border border-danger text-sm absolute items-center rounded-md transition-transform duration-500 z-0 h-16 max-w-[10rem] sm:max-w-[12rem]",
          {
            "transform translate-x-[11rem] sm:translate-x-[14rem]": isClicked,
            "transform translate-x-0": !isClicked,
          }
        )}
      >
        <div className="flex flex-row items-center truncate overflow-hidden -mx-4">
          <AiOutlineClockCircle className="hidden sm:block mr-2" />
          Due {dayjs(ticket.ticketDueDate).fromNow()}
        </div>
      </Button>
    </div>
  );
};

export default WithdrawTicket;
