import { type FC, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import {
  FaBookOpen,
  FaGithub,
  FaGlobeAmericas,
  FaTwitter,
} from "react-icons/fa";

import { Panel } from "../components/Panel";

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster />
      <header>
        <audio className="fixed top-0 right-0" loop autoPlay controls>
          <source src="meydan-surreal-forest.mp3" type="audio/mpeg" />
        </audio>
      </header>
      <main className="grow flex">{children}</main>
      <footer>
        <div className="hidden container text-center">
          <Panel className="inline-flex my-4 px-8 py-2 rounded-lg backdrop-blur-sm">
            <a
              className="inline-block mr-4 text-green active:text-green-bright focus:text-green-bright hover:text-green-bright"
              href="https://www.sunrisestake.com/"
              target="_blank"
              rel="noreferrer"
            >
              <FaGlobeAmericas size={32} title="Website" />
            </a>
            <a
              className="inline-block mr-4 text-green active:text-green-bright focus:text-green-bright hover:text-green-bright"
              href="https://docs.sunrisestake.com/"
              target="_blank"
              rel="noreferrer"
            >
              <FaBookOpen size={32} title="Docs" />
            </a>
            <a
              className="inline-block mr-4 text-green active:text-green-bright focus:text-green-bright hover:text-green-bright"
              href="https://twitter.com/sunrisestake"
              target="_blank"
              rel="noreferrer"
            >
              <FaTwitter size={32} title="Twitter" />
            </a>
            <a
              className="inline-block text-green active:text-green-bright focus:text-green-bright hover:text-green-bright"
              href="https://github.com/sunrise-stake"
              target="_blank"
              rel="noreferrer"
            >
              <FaGithub size={32} title="Github" />
            </a>
          </Panel>
        </div>
      </footer>
    </div>
  );
};

export { Layout };
