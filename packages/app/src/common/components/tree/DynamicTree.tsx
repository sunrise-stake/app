import { type CSSProperties, type FC } from "react";
import { type TreeComponent } from "../../../forest/utils";

export const DynamicTree: FC<{
  details: TreeComponent;
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
  variant?: "sm" | "md";
}> = ({ style = {}, onClick, className = "", variant = "md" }) => (
  <div onClick={onClick} className={className} style={style}>
    <div
      className={
        variant === "sm"
          ? "w-[300px] h-[300px] scale-50"
          : "w-[300px] h-[300px]"
      }
    >
      <img
        src="/placeholder-tree.png"
        alt="tree"
        className="w-full h-full object-contain"
      />
    </div>
  </div>
);
