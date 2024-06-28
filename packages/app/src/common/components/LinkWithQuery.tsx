import { Link, type LinkProps, useLocation } from "react-router-dom";
import { type FC, type PropsWithChildren } from "react";

export const LinkWithQuery: FC<PropsWithChildren & LinkProps> = ({
  children,
  to,
  ...props
}) => {
  const { search } = useLocation();

  const linkParams = typeof to === "string" ? { pathname: to } : to;

  return (
    <Link
      to={{
        ...linkParams,
        search,
      }}
      {...props}
    >
      {children}
    </Link>
  );
};
