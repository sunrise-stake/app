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
  const imageCol = (
    <div className="bla bla bla bla">
      {image !== undefined && <img src={image} />}
    </div>
  );
  const contentCol = (
    <div className="leading-normal">
      <div>
        {header !== undefined && (
          <div className="text-gray-900 font-bold text-xl">{header}</div>
        )}
        <p className="text-gray-700 text-base">{children}</p>
      </div>
    </div>
  );
  return imageLeft ? (
    <>
      {imageCol}
      {contentCol}
    </>
  ) : (
    <>
      {contentCol}
      {imageCol}
    </>
  );
};
