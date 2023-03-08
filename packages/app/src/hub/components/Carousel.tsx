import React, { type FC, useEffect, useState } from "react";
import clx from "classnames";

interface CarouselModel {
  headerText?: string | null;
  subText?: string | null;
  image: string;
}

interface Props {
  data: CarouselModel[];
  autoPlay?: boolean;
  size?: "normal" | "large";
  animationDuration?: 1 | 2 | 3 | number;
  leftItem?: React.ReactHTMLElement<HTMLElement> | React.ReactNode;
  rightItem?: React.ReactHTMLElement<HTMLElement> | React.ReactNode;
}

export const Carousel: FC<Props> = ({
  data,
  autoPlay = true,
  size = "normal",
  animationDuration = 3,
  leftItem,
  rightItem,
}: Props) => {
  const [activeItem, setActiveItem] = useState<number>(data.length > 2 ? 1 : 0);
  const [onDragState, setOnDragState] = useState(0);

  useEffect(() => {
    autoPlay &&
      setTimeout(() => {
        handleNextSlide(true);
      }, animationDuration * 1000);
  }, [activeItem]);
  const handleNextSlide = (increase: boolean): void => {
    if (increase) {
      if (activeItem + 1 > data.length - 1) {
        setActiveItem(0);
      } else {
        setActiveItem(activeItem + 1);
      }
    } else {
      if (activeItem === 0) {
        setActiveItem(data.length - 1);
      } else {
        setActiveItem(activeItem - 1);
      }
    }
  };

  const onDragEnded = (e: React.DragEvent): void => {
    if (e.clientX - onDragState < 150) {
      handleNextSlide(true);
    } else if (e.clientX - onDragState > 400) {
      handleNextSlide(false);
    }
  };

  const onDragStarted = (e: React.DragEvent): void => {
    setOnDragState(e.clientX);
  };
  return (
    <div className={clx("grid h-[300px] aspect-[16/9]")}>
      {data.map((item, index) => (
        <div
          style={{ gridArea: "inner-div" }}
          className={clx(
            "flex overflow-hidden relative transition-all duration-500 flex-col justify-center items-center w-full rounded-md cursor-pointer",
            {
              "z-20": index === activeItem,
              "opacity-0": index !== activeItem,
            }
          )}
          key={index}
          onDragStart={onDragStarted}
          onDragEnd={onDragEnded}
        >
          <img src={item.image} width="100%" />
          {index === activeItem && (
            <div className="flex absolute justify-between items-center w-full">
              <div
                onClick={() => {
                  handleNextSlide(false);
                }}
                className="ml-2"
              >
                {leftItem}
              </div>

              <div
                onClick={() => {
                  handleNextSlide(true);
                }}
                className="mr-2"
              >
                {rightItem}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
