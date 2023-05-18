import React, { type FC } from "react";
import { useScript } from "../../common/hooks";

export const MangroveFormButton: FC = () => {
  useScript("//embed.typeform.com/next/embed.js");
  return (
    <>
      <p className="text-md">You are eligible for a Mangrove NFT!</p>
      <button
        data-tf-popup="a1mDLP1e"
        data-tf-opacity="100"
        data-tf-size="100"
        data-tf-iframe-props="title=Feedback"
        data-tf-transitive-search-params
        data-tf-medium="snippet"
        className="bg-green-light text-white"
        style={{
          fontFamily: "Helvetica,Arial,sans-serif",
          display: "inline-block",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "#fff",
          fontSize: "20px",
          borderRadius: "25px",
          padding: "0 33px",
          fontWeight: "bold",
          height: "50px",
          cursor: "pointer",
          lineHeight: "50px",
          textAlign: "center",
          margin: 0,
          textDecoration: "none",
        }}
      >
        Please fill this short form to claim.
      </button>
    </>
  );
};
