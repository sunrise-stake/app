import { ASSETS } from "../../utils";
import { type CSSProperties, type FC, type PropsWithChildren } from "react";

type Props = PropsWithChildren & { style: CSSProperties };
export const Island: FC<Props> = ({ children, style }: Props) => (
  <div className="island" style={style}>
    <img src={ASSETS + "_LANDPLOT.png"} alt="island" />
    {children}
  </div>
);
