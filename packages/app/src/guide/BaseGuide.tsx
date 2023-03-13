import { GuideEntry, type GuideEntryProps } from "./GuideEntry";
import { type FC } from "react";

interface GuideProps {
  entries: GuideEntryProps[];
}

export const BaseGuide: FC<GuideProps> = ({ entries, ...props }) => {
  return (
    <div className="grid place-items-center">
      {entries.map((entry, i) => (
        <GuideEntry key={i} {...entry} imageLeft={i % 2 === 0} />
      ))}
    </div>
  );
};
