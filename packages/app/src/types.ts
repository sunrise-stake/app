import { SunriseClientWrapper } from "./lib/sunriseClientWrapper";

declare global {
  interface Window {
    client: SunriseClientWrapper;
  }
}
