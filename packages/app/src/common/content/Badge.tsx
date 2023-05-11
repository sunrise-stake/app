import { type FC } from "react";
import { TbAlertCircleFilled } from "react-icons/tb";

export const AlertBadge: FC = () => (
  <TbAlertCircleFilled className="text-red-500 absolute w-12 -right-8 top-0" />
);
