import { ASSETS } from "../../utils";
import { type CSSProperties, type FC, type PropsWithChildren } from "react";

type Props = PropsWithChildren & { style?: CSSProperties };
export const Island: FC<Props> = ({ children, style }: Props) => (
  <div className="w-[300px] h-[300px]" style={style}>
    <img
      alt="Island"
      src={ASSETS + "_LANDPLOT.png"}
      className="absolute bottom-0"
    />
    {children}
  </div>
);
