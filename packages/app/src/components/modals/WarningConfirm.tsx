import React, { type FC, type ReactNode } from "react";

const WarningConfirm: FC<{
  onConfirm: (confirmed: boolean) => void;
  idx: number;
  children: ReactNode;
}> = ({ onConfirm, idx, children }) => (
  <>
    <div className=" border-gray-300 m-5 p-5 text-start bg-background rounded-md">
      {children}
    </div>
    <div className="relative flex m-5 p-5">
      <div className="flex h-5">
        <input
          id={`checkbox-${idx}`}
          aria-describedby={`checkbox-description-${idx}`}
          name={`checkbox-${idx}`}
          type="checkbox"
          onChange={(e) => {
            onConfirm(e.target.checked);
          }}
          className="h-4 w-4 rounded-full text-green"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={`checkbox-${idx}`} className="font-bold text-white">
          I Understand
        </label>
      </div>
    </div>
  </>
);

export default WarningConfirm;
