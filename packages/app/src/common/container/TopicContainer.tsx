import React, {
  type ForwardRefRenderFunction,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import clx from "classnames";

interface TitleProps {
  children: ReactNode;
}

const Title: React.FC<TitleProps> = ({ children }) => (
  <div className="h-[25vh] flex items-center justify-center">{children}</div>
);

interface MainProps {
  children: ReactNode;
}

const Main: React.FC<MainProps> = ({ children }) => (
  <div
    className={`h-[75vh] bg-wood-sm bg-cover overflow-y-auto pt-5 mb-5 md:bg-wood-md lg:bg-wood-lg lg:flex lg:items-center`}
  >
    {children}
  </div>
);

const _TopicContainer: ForwardRefRenderFunction<
  HTMLDivElement,
  {
    className?: string;
    active?: boolean;
    titleContents: ReactNode;
  } & React.HTMLAttributes<HTMLElement> &
    PropsWithChildren
> = ({ children, titleContents, className, active = false, ...rest }, ref) => (
  <div
    className={clx(
      "relative flex flex-col justify-start items-center",
      className
    )}
    ref={ref}
    {...rest}
  >
    <Title>{titleContents}</Title>
    <Main>{children}</Main>
  </div>
);

export const TopicContainer = React.forwardRef(_TopicContainer);
