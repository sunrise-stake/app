import { type FC } from "react";
import { IoWarningOutline } from "react-icons/io5";

const ShutdownBanner: FC = () => {
  return (
    <div className="w-full bg-danger text-white py-3 px-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <IoWarningOutline size={24} className="flex-shrink-0" />
        <span className="font-semibold">
          Sunrise is shutting down. Please withdraw your SOL now.
        </span>
      </div>
    </div>
  );
};

export { ShutdownBanner };
