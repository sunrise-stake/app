import { type FC, type PropsWithChildren } from "react";
import { type Partner } from "./types";

const PartnerApp: FC<PropsWithChildren & { partner: Partner }> = ({
  children,
  partner,
}) => (
  <a
    href={partner.website}
    target="_blank"
    rel="noreferrer"
    className="hover:cursor-pointer bg-cover bg-blend-multiply bg-center bg-no-repeat hover:scale-110 hover:brightness-110 hover:transition-all"
    style={
      partner.imageUrl !== undefined
        ? {
            backgroundImage: `url(${partner.imageUrl})`,
            backgroundColor: "grey",
          }
        : {
            backgroundColor: "white",
          }
    }
  >
    {children}
  </a>
);

export { PartnerApp };
