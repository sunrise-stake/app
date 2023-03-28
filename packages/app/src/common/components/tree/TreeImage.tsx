import { ASSETS } from "../../utils";
import { type CSSProperties, type FC } from "react";

export const TreeImage: FC<{ src: string; style: CSSProperties }> = ({
  src,
  style,
}) => (
  <div className="tree" style={style}>
    <img src={ASSETS + src} alt="tree" />
  </div>
);
