import React, { useState, useEffect } from "react";
import clx from "classnames";
import { Button } from "./Button";
import { TicketIcon } from "@heroicons/react/24/solid";
import { MdOutlineLockClock, MdOutlineLockOpen } from "react-icons/md";
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
    <div className="relative my-4 flex">
      <Button
        variant="ticket"
        className="text-white relative z-10"
        onClick={() => {
          if (ticket.ticketDue === undefined || !ticket.ticketDue) {
            console.log("Ticket is not due yet");
            setIsClicked((prevState) => !prevState);
            return;
          }
          redeem(ticket);
        }}
      >
        <TicketIcon width={36} className="mr-2" />
        {ticket.ticketDue ? (
          <MdOutlineLockOpen width={36} />
        ) : (
          <MdOutlineLockClock width={36} />
        )}

        <div className="ml-2">1 Ticket</div>
        <div className="text-xs text-outset relative top-5">
          {toFixedWithPrecision(toSol(ticket.lamportsAmount))} SOL
        </div>
      </Button>

      <Button
        onClick={() => setIsClicked(false)}
        variant={"danger"}
        className={clx(
          "text-white text-sm p-2 relative rounded transition-transform duration-500 z-0 m-auto w-44",
          {
            "transform translate-x-5": isClicked,
            "transform -translate-x-full": !isClicked,
          }
        )}
      >
        {ticket.ticketDue ? (
          "Redeem now"
        ) : (
          <>
            <AiOutlineClockCircle className="mr-2" /> Due{" "}
            {ticket.ticketDueDate ? dayjs(ticket.ticketDueDate).fromNow() : ""}
          </>
        )}
      </Button>
    </div>
  );
};

export default WithdrawTicket;
