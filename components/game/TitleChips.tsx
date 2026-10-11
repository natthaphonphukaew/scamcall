import type { TitleId } from "@/lib/game/types";
import { TITLE_INFO } from "@/lib/copy";

export function TitleChips({ titles, className = "" }: { titles: TitleId[]; className?: string }) {
  if (titles.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1 ${className}`}>
      {titles.map((t) => (
        <li key={t} className="rounded-full bg-surface px-2 py-0.5 text-xs">
          {TITLE_INFO[t].emoji} {TITLE_INFO[t].name}
        </li>
      ))}
    </ul>
  );
}
