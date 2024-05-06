import {
  FaBookOpen,
  FaDiscord,
  FaGithub,
  FaGlobeAmericas,
  FaTwitter,
} from "react-icons/fa";
import { Panel } from "./Panel";
import React, { type FC } from "react";

export const ExternalLinks: FC = () => {
  return (
    <Panel className="inline-flex px-4 py-2 rounded-lg backdrop-blur-sm">
      <a
        className="inline-block mr-4 text-green active:text-green-light focus:text-green-light hover:text-green-light"
        href="https://twitter.com/sunrisestake"
        target="_blank"
        rel="noreferrer"
      >
        <FaTwitter size={32} title="Twitter" />
      </a>
      <a
        className="inline-block mr-4 text-green active:text-green-light focus:text-green-light hover:text-green-light"
        href="https://discord.gg/H6FRFmYdXY"
        target="_blank"
        rel="noreferrer"
      >
        <FaDiscord size={32} title="Discord" />
      </a>
      <a
        className="inline-block mr-4 text-green active:text-green-light focus:text-green-light hover:text-green-light"
        href="https://docs.sunrisestake.com/"
        target="_blank"
        rel="noreferrer"
      >
        <FaBookOpen size={32} title="Docs" />
      </a>
      <a
        className="inline-block mr-4 text-green active:text-green-light focus:text-green-light hover:text-green-light"
        href="https://github.com/sunrise-stake"
        target="_blank"
        rel="noreferrer"
      >
        <FaGithub size={32} title="Github" />
      </a>
      <a
        className="inline-block text-green active:text-green-light focus:text-green-light hover:text-green-light"
        href="https://www.sunrisestake.com/"
        target="_blank"
        rel="noreferrer"
      >
        <FaGlobeAmericas size={32} title="Website" />
      </a>
    </Panel>
  );
};
