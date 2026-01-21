import { type FC, type MouseEventHandler, useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import clx from "classnames";

interface Props {
  imgUrl: string;
  alt: string;
  onClick: MouseEventHandler;
}

export const AttentionIcon: FC<Props> = ({ imgUrl, alt, onClick }) => {
  const [show, setShow] = useState(true);
  const [animateChild, setAnimateChild] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateChild(true);
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return show ? (
    <div
      className={clx(
        "absolute flex -top-2 -right-8 group transform transition-transform duration-500 ease-out animate-pulse",
        animateChild ? "scale-100" : "scale-0"
      )}
    >
      <img
        className="h-6 w-6 rounded-full p-0.5 border-2 border-black"
        src={imgUrl}
        alt={alt}
        onClick={onClick}
      />
      <button
        className="-mt-2 -ml-2 align-top h-2 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          setShow(false);
        }}
      >
        <IoClose size={12} />
      </button>
    </div>
  ) : null;
};
