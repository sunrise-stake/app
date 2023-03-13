import React, { type FC } from "react";

export interface GuideEntryProps {
  header?: string;
  children: React.ReactNode;
  image?: string;
  imageLeft?: boolean;
}

export const GuideEntry: FC<GuideEntryProps> = ({
  header,
  children,
  image,
  imageLeft = false,
}) => {
  return (
    <div className="">
      {image !== undefined && (
        <img
          src={image}
          className={`w-1/6 ${imageLeft ? "float-left" : "float-right"}`}
        />
      )}
      <div className="px-6 py-4">
        {header !== null && (
          <div className="font-bold text-xl mb-2">{header}</div>
        )}
        <p className="text-gray-700">{children}</p>
      </div>
    </div>
  );
};
