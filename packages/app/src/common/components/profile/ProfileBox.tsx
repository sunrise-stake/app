import { EnvelopeIcon, LinkIcon } from "@heroicons/react/20/solid";
import { type PublicKey } from "@solana/web3.js";
import { type FC } from "react";
import { useProfile } from "../../hooks/useProfile";
import { type ParentRelationship } from "../../../api/types";
import { toShortBase58 } from "../../utils";

export const ProfileBox: FC<{
  address: PublicKey;
  relationship?: ParentRelationship;
  intermediaries?: PublicKey[];
}> = ({ address, relationship, intermediaries = [] }) => {
  const profile = useProfile(address);

  return (
    <div className="profileBox z-40 relative col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow invisible group-hover:visible group-hover:transition-[visibility] group-focus:visible group-focus:transition-[visibility]">
      <div className="flex w-full items-center justify-between space-x-6 p-6">
        <div
          className="flex-1 truncate bg-white visible"
          style={{
            backgroundColor: "rgba(255, 255, 255, .25)",
            boxShadow: "0 0 5px 10px rgba(255, 255, 255, .25)",
          }}
        >
          <div className="flex items-center space-x-3">
            <h3 className="truncate text-md font-medium text-gray-900">
              {profile.name}
            </h3>
          </div>
        </div>
        <img
          className="visible h-10 w-10 flex-shrink-0 rounded-full bg-gray-300"
          src={profile.image}
          alt=""
        />
      </div>
      <div className="inline-flex w-full items-center">
        {intermediaries.length > 0 && (
          <div className="flex w-0 flex-1 text-sm p-2">
            You are connected to this account through{" "}
            {intermediaries.map(toShortBase58).join(", ")}
          </div>
        )}
        {relationship !== undefined && intermediaries.length === 0 && (
          <div className="items-center flex w-0 flex-1 text-sm p-2 justify-center">
            You{" "}
            {relationship === "PARENT_IS_SENDER"
              ? "☀️ sent ☀️ gSOL to"
              : "☀️ received ☀️ gSOL from"}{" "}
            this account.
          </div>
        )}
      </div>
      <div>
        <div className="-mt-px flex divide-x divide-gray-200">
          <div className="flex w-0 flex-1">
            <a
              href={`https://civic.me/${profile.address}`}
              target="_blank"
              className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
              rel="noreferrer"
            >
              <LinkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Profile
            </a>
          </div>
          <div className="-ml-px flex w-0 flex-1">
            <a
              onClick={() => {
                alert("Coming soon!");
              }}
              className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
            >
              <EnvelopeIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              Message
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
