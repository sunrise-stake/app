import mangrove from "./mangrove.png";
import { MangroveDetails } from "./MangroveDetails";
import { InfoModal } from "../../common/components/modals/InfoModal";
import React, { type FC } from "react";
import { type ModalControl } from "../../common/hooks";
import { Link, useNavigate } from "react-router-dom";
import { AppRoute } from "../../Routes";

interface Props {
  control: ModalControl;
}
export const MangroveModal: FC<Props> = ({ control }) => {
  const navigate = useNavigate();

  const onOK = (): void => {
    control.onModalOK();
    navigate(AppRoute.Lock);
  };

  return (
    <InfoModal
      title="Mangrove Rewards"
      modalControl={control}
      icon={<img src="partners/panasea.png" alt="Mangrove Reward" />}
      ok={onOK}
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
          <p>To be eligible for a mangrove NFT:</p>
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
                at least 0.5 gSOL
              </li>
              <li>
                Fill in a short form; the form will be displayed once you lock
                your gSOL.
              </li>
            </ul>
          </p>
          <p>Complete the steps before August 8th!</p>
          <MangroveDetails />
        </div>
      </div>
    </InfoModal>
  );
};
