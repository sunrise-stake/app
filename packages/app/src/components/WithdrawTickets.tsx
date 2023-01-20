import React, { useState, useEffect } from "react";
import clx from "classnames";
import { Button } from "./Button";
import { TicketIcon } from "@heroicons/react/24/solid";
// import { MdOutlineLockClock, MdOutlineLockOpen } from "react-icons/md";
import { AiOutlineClockCircle } from "react-icons/ai";
import { TicketAccount } from "../lib/client/types/TicketAccount";
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
      return () => clearTimeout(timeout);
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
        className="relative z-10 h-16 min-w-[12rem]"
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
          <TicketIcon width={44} className="mr-4 py-1 px-2 rounded" />
          {/* {ticket.ticketDue ? (
            <MdOutlineLockOpen width={36} className="text-outset" />
          ) : (
            <MdOutlineLockClock width={36} className="text-danger" />
          )} */}

          {/* <div className="ml-2">1 Ticket</div> */}
          <div className="text-lg ml-4 ">
            {toFixedWithPrecision(toSol(ticket.lamportsAmount))} SOL
          </div>
        </div>
      </Button>

      <Button
        onClick={() => setIsClicked(false)}
        variant="secondary"
        className={clx(
          "text-danger border border-danger text-sm px-2 py-1 absolute items-center rounded-md transition-transform duration-500 z-0 h-16 max-w-[12rem]",
          {
            "transform translate-x-[16rem]": isClicked,
            "transform translate-x-0": !isClicked,
          }
        )}
      >
        <div className="flex flex-row items-center truncate overflow-hidden">
          <AiOutlineClockCircle className="mr-2" />
          Due {dayjs(ticket.ticketDueDate).fromNow()}
        </div>
      </Button>
    </div>
  );
};

export default WithdrawTicket;
