import { type FC } from "react";

export const BreakpointHero: FC = () => (
  <div className="card shadow-xl w-96 text-gray-800">
    <figure>
      <h2 className="card-title">Win €200 at&nbsp;</h2>
      <img src="/breakpoint.svg" alt="Breakpoint" />
    </figure>
    <div className="card-body items-center text-center">
      <p className="text-lg">Connect wallet to get your referral link</p>
    </div>
  </div>
);
