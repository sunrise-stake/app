import mangrove from "./mangrove.png";
import { MangroveDetails } from "./MangroveDetails";
import { InfoModal } from "../../common/components/modals/InfoModal";
import React, { type FC } from "react";
import { type ModalControl } from "../../common/hooks";
import { Link } from "react-router-dom";

interface Props {
  control: ModalControl;
}
export const MangroveModal: FC<Props> = ({ control }) => (
  <InfoModal
    title="Mangrove Rewards"
    modalControl={control}
    icon={<img src="partners/panasea.png" alt="Mangrove Reward" />}
  >
    <div className="flex flex-auto">
      <img
        src={mangrove}
        alt="Mangrove Reward"
        className="hidden sm:block w-1/3 h-auto object-cover"
      />
      <div className="flex flex-col text-md gap-2 pl-2 text-start">
        <p>
          Sunrise is airdropping mangrove NFTs to users. Each mangrove NFT
          represents 1 mangrove tree that will be planted by{" "}
          <a
            className="font-bold"
            href="https://panasea.io/"
            target="_blank"
            rel="noreferrer"
          >
            PanaSea
          </a>
          .
        </p>
        <h2 className="text-lg text-green font-bold pt-5">
          Claim your Mangrove!
        </h2>
        <p>To be eligible for a mangrove NFT you can either:</p>
        <p className="ml-5">
          <ul className="justify-start list-disc">
            <li>
              <Link
                to="/lock"
                className="font-bold"
                onClick={control.onModalClose}
              >
                Lock
              </Link>{" "}
              at least 1 gSOL
            </li>
            <li>
              <Link
                to="/grow"
                className="font-bold"
                onClick={control.onModalClose}
              >
                Donate
              </Link>{" "}
              at least 0.05 gSOL <span className="font-serif">(~$1)</span> to an
              impact organisation
            </li>
          </ul>
        </p>
        <p>
          and fill in a short form{" "}
          <span className="font-bold">before June 8th.</span>
        </p>
        <MangroveDetails />
      </div>
    </div>
  </InfoModal>
);
