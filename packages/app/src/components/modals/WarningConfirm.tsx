import React, { FC, ReactNode } from "react";

const WarningConfirm: FC<{
  onConfirm: (confirmed: boolean) => void;
  idx: number;
  children: ReactNode;
}> = ({ onConfirm, idx, children }) => (
  <div className="border-2 border-gray-300 m-5 p-5 text-start">
    {children}
    <div className="relative flex mt-5">
      <div className="flex h-5">
        <input
          id={`checkbox-${idx}`}
          aria-describedby={`checkbox-description-${idx}`}
          name={`checkbox-${idx}`}
          type="checkbox"
          onChange={(e) => onConfirm(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </div>
      <div className="ml-3 text-sm">
        <label
          htmlFor={`checkbox-${idx}`}
          className="font-medium text-gray-700"
        >
          I understand
        </label>
      </div>
    </div>
  </div>
);

export default WarningConfirm;
