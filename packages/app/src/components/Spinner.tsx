import React, { FC } from "react";

const Spinner: FC = () => {
  return (
    <div className="flex justify-center items-center mt-2">
      <div
        className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full"
        role="status"
      ></div>
    </div>
  );
};

export default Spinner;
