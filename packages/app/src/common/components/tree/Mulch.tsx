import { ASSETS } from "../../utils";
import { type FC } from "react";

export const Mulch: FC = () => (
  <div
    className="mulch"
    style={{
      width: "200px",
    }}
  >
    <img src={ASSETS + "_MULCHBAG.png"} alt="mulch" />
  </div>
);
