import { type FC, type PropsWithChildren } from "react";
import { type Partner } from "../types";
import { Link } from "react-router-dom";

type PartnerProps = PropsWithChildren & { partner: Partner };

const ExternalPartner: FC<PartnerProps> = ({ children, partner }) => (
  <a
    href={partner.website || "#"}
    target={partner.website ? "_blank" : "_self"}
    rel="noreferrer"
    className="transition-all cursor-pointer bg-cover bg-blend-multiply bg-center bg-no-repeat hover:scale-105 hover:brightness-105"
    style={
      partner.imageUrl !== undefined
        ? {
            backgroundImage: `url(${partner.imageUrl})`,
            backgroundColor: "grey",
            backgroundSize: "contain",
          }
        : {
            backgroundColor: "white",
          }
    }
  >
    {children}
  </a>
);

const InternalPartner: FC<PartnerProps> = ({ children, partner }) => (
  <Link
    to={partner.website || "#"}
    className="transition-all cursor-pointer bg-cover bg-blend-multiply bg-center bg-no-repeat hover:scale-105 hover:brightness-105"
    style={
      partner.imageUrl !== undefined
        ? {
            backgroundImage: `url(${partner.imageUrl})`,
            backgroundColor: "grey",
            backgroundSize: "contain",
          }
        : {
            backgroundColor: "white",
          }
    }
  >
    {children}
  </Link>
);

const PartnerButton: FC<PartnerProps> = ({ children, partner }) => {
  if (partner.internal === true)
    return <InternalPartner partner={partner}>{children}</InternalPartner>;
  else return <ExternalPartner partner={partner}>{children}</ExternalPartner>;
};

export { PartnerButton };
