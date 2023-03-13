import {
  FaBookOpen,
  FaGithub,
  FaGlobeAmericas,
  FaTwitter,
} from "react-icons/fa";
import { Panel } from "./Panel";
import { type FC } from "react";

export const ExternalLinks: FC = () => {
  return (
    <Panel className="hidden md:inline-flex my-4 px-8 py-2 rounded-lg backdrop-blur-sm">
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
  );
};
