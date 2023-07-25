import { EventRouter } from "./common/container/EventRouter";
import {
  type FC,
  type MutableRefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ForestApp } from "./forest/ForestApp";
import { GrowApp } from "./grow/GrowApp";
import { HubApp } from "./hub/HubApp";
import { LockingApp } from "./locking/LockingApp";
import { StakingApp } from "./staking/StakingApp";
import { Link, useLocation } from "react-router-dom";
import { Layout } from "./common/partials/Layout";
import { debounce } from "./common/utils";
import { useHelp } from "./common/context/HelpContext";

export enum AppRoute {
  Connect = "/connect", // not a route at present TODO fix
  Forest = "/forest",
  Grow = "/grow",
  Hub = "/",
  Lock = "/lock",
  Stake = "/stake",
}

export const Routes: FC = () => {
  const location = useLocation();
  const appRefs = {
    forest: useRef<null | HTMLDivElement>(null),
    grow: useRef<null | HTMLDivElement>(null),
    hub: useRef<null | HTMLDivElement>(null),
    locking: useRef<null | HTMLDivElement>(null),
    lost: useRef<null | HTMLDivElement>(null),
    staking: useRef<null | HTMLDivElement>(null),
  };
  const [currentRouteApp, setCurrentRouteApp] =
    useState<null | MutableRefObject<null | HTMLDivElement>>(null);
  window.addEventListener(
    "resize",
    debounce(() => {
      currentRouteApp?.current?.scrollIntoView();
    }, 100),
    { passive: true }
  );

  useLayoutEffect(() => {
    appRefs.hub.current?.scrollIntoView();
  }, []);

  const { setCurrentHelpRoute } = useHelp();

  return (
    <Layout>
      <EventRouter
        location={location}
        routes={[
          {
            path: AppRoute.Hub,
            onMatch: () => {
              appRefs.hub.current?.scrollIntoView({
                behavior: "smooth",
              });
              setCurrentRouteApp(appRefs.hub);
              setCurrentHelpRoute(AppRoute.Hub);
            },
          },
          {
            path: AppRoute.Forest,
            onMatch: () => {
              appRefs.forest.current?.scrollIntoView({
                behavior: "smooth",
              });
              setCurrentRouteApp(appRefs.forest);
              setCurrentHelpRoute(AppRoute.Forest);
            },
          },
          {
            path: AppRoute.Grow,
            onMatch: () => {
              appRefs.grow.current?.scrollIntoView({
                behavior: "smooth",
              });
              setCurrentRouteApp(appRefs.grow);
              setCurrentHelpRoute(AppRoute.Grow);
            },
          },
          {
            path: AppRoute.Lock,
            onMatch: () => {
              appRefs.locking.current?.scrollIntoView({
                behavior: "smooth",
              });
              setCurrentRouteApp(appRefs.locking);
              setCurrentHelpRoute(AppRoute.Lock);
            },
          },
          {
            path: AppRoute.Stake,
            onMatch: () => {
              appRefs.staking.current?.scrollIntoView({
                behavior: "smooth",
              });
              setCurrentRouteApp(appRefs.staking);
              setCurrentHelpRoute(AppRoute.Stake);
            },
          },
          {
            path: "/*",
            onMatch: () => {
              appRefs.lost.current?.scrollIntoView({
                behavior: "smooth",
              });
              setCurrentRouteApp(appRefs.lost);
            },
          },
        ]}
      />
      <div className="AppGrid">
        <ForestApp
          id="forest-app"
          className="App ForestApp"
          ref={appRefs.forest}
        />
        <GrowApp
          id="grow-app"
          className="App GrowApp"
          ref={appRefs.grow}
          active={currentRouteApp === appRefs.grow}
        />
        <HubApp id="hub-app" className="App HubApp" ref={appRefs.hub} />
        <LockingApp
          id="locking-app"
          className="App LockingApp"
          ref={appRefs.locking}
          active={currentRouteApp === appRefs.locking}
        />
        <StakingApp
          id="staking-app"
          className="App StakingApp"
          ref={appRefs.staking}
          active={currentRouteApp === appRefs.staking}
        />
        <div
          id="lost-app"
          className="App LostApp flex flex-col min-h-screen justify-center items-center"
          ref={appRefs.lost}
        >
          <p className="text-2xl font-bold">
            Oh, oh. You&apos;ve got lost in the woods... 🐺
          </p>
          <Link
            className="mt-2 px-5 py-3 border-2 border-green rounded-lg leading-6 text-green text-xl"
            to="/"
          >
            Back home
          </Link>
        </div>
      </div>
    </Layout>
  );
};
