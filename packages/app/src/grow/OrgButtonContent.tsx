import React, { type FC, type PropsWithChildren } from "react";

export const OrgButtonContent: FC<PropsWithChildren> = ({ children }) => (
  <div
    className="p-8 rounded-md w-40 h-30 text-white text-xl font-medium text-center"
    style={{
      textShadow: "1px 2px 3px rgb(0 0 0 / 80%)",
    }}
  >
    {children}
  </div>
);
