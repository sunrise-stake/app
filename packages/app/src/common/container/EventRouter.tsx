import { type FC, type ReactNode, useEffect, useState } from "react";
import { matchPath, type PathMatch, type Location } from "react-router-dom";

interface Route {
  path: string;
  onMatch: (matchInfo: PathMatch | null) => void;
  onLeave?: () => void;
}

type Routes = Route[];

interface RouterProps {
  children?: ReactNode;
  location: Location;
  routes: Routes;
}

const EventRouter: FC<RouterProps> = ({
  children = null,
  location,
  routes,
}) => {
  const [prevRoute, updatePrevRoute] = useState<any>(null);

  useEffect(() => {
    let matchInfo: PathMatch | null = null;
    const matchRoute = routes.find((route) => {
      const routeMatch = matchPath(route.path, location.pathname);
      if (routeMatch) {
        matchInfo = routeMatch;
        return true;
      } else {
        return false;
      }
    });

    if (!matchRoute) {
      throw new Error(`[EffectRouter] Unmatched route: ${location.pathname}`);
    } else {
      if (typeof prevRoute?.route?.onLeave === "function")
        prevRoute.route.onLeave(prevRoute.info);
      updatePrevRoute({ route: matchRoute, info: matchInfo });
      matchRoute?.onMatch(matchInfo);
    }
  }, [location]);

  return <>{children}</>;
};

export { EventRouter };
