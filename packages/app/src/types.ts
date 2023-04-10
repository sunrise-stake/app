import { type SunriseClientWrapper } from "./common/sunriseClientWrapper";

declare global {
  interface Window {
    client: SunriseClientWrapper;
  }
}
