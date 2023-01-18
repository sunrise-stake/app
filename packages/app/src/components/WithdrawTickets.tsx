import React, { useState } from "react";
import clx from "classnames";
import { Button } from "./Button";
import { TicketIcon } from "@heroicons/react/24/solid";
import { MdOutlineLockClock, MdOutlineLockOpen } from "react-icons/md";
import { AiOutlineClockCircle } from "react-icons/ai";
import { TicketAccount } from "../lib/client/types/TicketAccount";
import { toFixedWithPrecision, toSol } from "../lib/util";
import dayjs from "dayjs";

interface WithdrawTicketProps {
  ticket: TicketAccount;
  redeem: (ticket: TicketAccount) => void;
}

const WithdrawTicket: React.FC<WithdrawTicketProps> = ({ ticket, redeem }) => {
  const [isHovered, setIsHovered] = useState(false);

  // TODO: Think of a better way
  if (ticket.ticketDue === undefined) {
    ticket.ticketDue = false;
  }

  return (
    <div
      className="relative my-4 flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        variant="ticket"
        className="text-white relative z-10"
        onClick={() => {
          if (ticket.ticketDue === undefined || !ticket.ticketDue) {
            console.log("Ticket is not due yet");
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
        variant={ticket.ticketDue ? "ticket" : "danger"}
        className={clx(
          "text-white text-sm p-2 relative rounded transition-transform duration-500 z-0 m-auto w-44",
          {
            "transform translate-x-5": isHovered,
            "transform -translate-x-full": !isHovered,
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
