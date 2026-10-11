import type { BadgeId } from "@/lib/game/types";
import { BADGE_INFO, COPY } from "@/lib/copy";

/** เหรียญทั้งหมด — ที่ยังไม่ได้แสดงจางพร้อมบอกวิธีได้ */
export function BadgeGrid({ owned }: { owned: BadgeId[] }) {
  const have = new Set(owned);
  return (
    <section>
      <h2 className="mb-2 font-bold">
        {COPY.badgesTitle} {have.size}/{Object.keys(BADGE_INFO).length}
      </h2>
      <ul className="grid grid-cols-2 gap-2">
        {(Object.keys(BADGE_INFO) as BadgeId[]).map((id) => {
          const b = BADGE_INFO[id];
          return (
            <li
              key={id}
              className={`rounded-card bg-surface-raised p-3 text-sm ${have.has(id) ? "" : "opacity-40 grayscale"}`}
            >
              <p className="text-2xl" aria-hidden>
                {b.emoji}
              </p>
              <p className="font-bold">{b.name}</p>
              <p className="text-xs text-muted">{b.how}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
