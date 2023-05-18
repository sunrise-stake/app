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
        className="w-1/3 h-auto object-cover"
      />
      <div className="flex flex-col text-md gap-2 pl-2 text-start">
        <p>
          Sunrise has teamed up with{" "}
          <a
            className="font-bold"
            href="https://panasea.io/"
            target="_blank"
            rel="noreferrer"
          >
            Panasea
          </a>{" "}
          and{" "}
          <a
            className="font-bold"
            href="https://coinablepay.com/"
            target="_blank"
            rel="noreferrer"
          >
            Coinable
          </a>{" "}
          to plant mangroves in Costa Rica.
        </p>
        <p>
          You can get your own mangrove NFT{" "}
          <a className="font-bold" href="https://coinablepay.com/store/panasea">
            here
          </a>
        </p>
        <h2 className="text-lg text-green font-bold pt-5">
          Claim your Mangrove!
        </h2>
        <p>
          As a Sunrise user, we are proud to buy a mangrove in your name! To
          claim your NFT, you need to:
        </p>
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
              or{" "}
              <Link
                to="/grow"
                className="font-bold"
                onClick={control.onModalClose}
              >
                donate
              </Link>{" "}
              at least 0.05 gSOL ($1) to an impact organisation
            </li>
          </ul>
        </p>
        <p>
          and fill in a short form, before June 8th, to be airdropped an NFT
          representing one planted mangrove
        </p>
        <MangroveDetails />
      </div>
    </div>
  </InfoModal>
);
