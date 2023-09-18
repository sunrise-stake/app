import { ASSETS } from "../../utils";
import { type CSSProperties, type FC, type PropsWithChildren } from "react";

type Props = PropsWithChildren & { style?: CSSProperties; className?: string };
export const Island: FC<Props> = ({ children, style, className }: Props) => (
  <div className={className} style={style}>
    <img
      alt="Island"
      src={ASSETS + "_LANDPLOT.png"}
      className="absolute bottom-0"
    />
    {children}
  </div>
);
