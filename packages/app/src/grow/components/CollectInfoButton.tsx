import { type FC, type PropsWithChildren } from "react";

export const CollectInfoButton: FC<
  PropsWithChildren & { imageUrl?: string }
> = ({ children, imageUrl }) => {
  return (
    <button
      data-tf-popup="ycDtkUgC"
      data-tf-opacity="100"
      data-tf-size="100"
      data-tf-iframe-props="title=Partner Contacts"
      data-tf-transitive-search-params
      data-tf-medium="snippet"
      className="transition-all cursor-pointer bg-cover bg-blend-multiply bg-center bg-no-repeat hover:scale-105 hover:brightness-105"
      style={
        imageUrl !== undefined
          ? {
              backgroundImage: `url(${imageUrl})`,
              backgroundColor: "grey",
            }
          : {
              backgroundColor: "white",
            }
      }
    >
      {children}
    </button>
  );
};
