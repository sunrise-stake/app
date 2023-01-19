import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

export enum NotificationType {
  success = "success",
  error = "error",
  info = "info",
}

export function notifyTransaction(n: {
  type: NotificationType;
  message: string;
  description?: string;
  txid?: string;
}): void {
  toast.custom(
    (t) => (
      <div
        className={`max-w-sm w-full bg-white shadow-lg rounded-md mt-2 p-2 mx-4 mb-4`}
      >
        <div className={`p-4`}>
          <div className={`flex items-center`}>
            <div className={`flex-shrink-0`}>
              {n.type === "success" ? (
                <CheckCircleIcon className={`h-8 w-8 mr-1 text-green`} />
              ) : null}
              {n.type === "info" && (
                <InformationCircleIcon className={`h-8 w-8 mr-1`} />
              )}
              {n.type === "error" && (
                <XCircleIcon className={`h-8 w-8 mr-1 text-danger`} />
              )}
            </div>
            <div className={`ml-2 w-0 flex-1`}>
              <div className={`font-bold text-outset`}>{n.message}</div>
              {n.description !== undefined ? (
                <p className={`mt-0.5 text-sm text-outset`}>{n.description}</p>
              ) : null}
              {n.txid !== undefined ? (
                <div className="flex flex-row text-outset">
                  <a
                    href={
                      "https://explorer.solana.com/tx/" +
                      n.txid +
                      `?cluster=mainnet`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-row link link-accent"
                  >
                    <svg
                      className="flex-shrink-0 h-4 ml-2 mt-0.5  w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      ></path>
                    </svg>
                    <div className="flex mx-4">
                      {n.txid.slice(0, 8)}...
                      {n.txid.slice(n.txid.length - 8)}
                    </div>
                  </a>
                </div>
              ) : null}
            </div>
            <div className={`ml-4 flex-shrink-0 self-start flex`}>
              <button
                onClick={() => toast.dismiss(t.id)}
                className={`default-transition rounded-md inline-flex text-outset hover:opacity-75 focus:outline-none`}
              >
                <span className={`sr-only`}>Close</span>

                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      position: "bottom-left",
    }
  );
}
