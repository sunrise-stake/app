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
    // <div className="w-full flex flex-col sm:flex-row">
    <div
      className={`${
        imageLeft ? "float-left" : "float-right"
      } sm:w-full lg:w-1/2 px-8 h-auto
        border-r border-b border-l border-gray-400 lg:border-l-0 lg:border-t lg:border-gray-400 bg-white rounded-b lg:rounded-b-none lg:rounded-r p-4`}
    >
      {image !== undefined && (
        <img
          src={image}
          className={`w-1/2 ${imageLeft ? "float-left" : "float-right"}`}
        />
      )}
      <div className="px-4 flex flex-col justify-between leading-normal">
        <div className="mb-8">
          {header !== undefined && (
            <div className="text-gray-900 font-bold text-xl mb-2">{header}</div>
          )}
          <p className="text-gray-700 text-base">{children}</p>
        </div>
      </div>
    </div>
    // </div>
  );
};
