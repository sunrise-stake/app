import { GuideEntry, type GuideEntryProps } from "./GuideEntry";
import { type FC } from "react";

interface GuideProps {
  entries: GuideEntryProps[];
}

export const BaseGuide: FC<GuideProps> = ({ entries, ...props }) => {
  return (
    <div className="absolute top-8 bottom-0 inset-x-1 overflow-auto">
      <div className="grid grid-cols-2 grid-rows-2 gap-2 items-center place-items-center justify-center p-4">
        {entries.map((entry, i) => (
          <GuideEntry key={i} {...entry} imageLeft={i % 2 === 0} />
        ))}
      </div>
    </div>
  );
};
