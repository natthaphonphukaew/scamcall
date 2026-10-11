import Link from "next/link";
import { PlayerChip } from "@/components/game/PlayerChip";
import { COPY } from "@/lib/copy";

/** แถบบน/ล่างที่ลอยทับแผนที่ — ปุ่มเล็ก ไม่บังฉาก */
export function CampusHud({ saved, total, attribution }: { saved: number; total: number; attribution: string }) {
  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto rounded-2xl bg-black/55 px-3 py-2 text-white backdrop-blur">
          <h1 className="text-base font-bold leading-tight">{COPY.campusTitle}</h1>
          <p className="text-xs opacity-80">
            {COPY.savedFriends} {saved}/{total}
          </p>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <PlayerChip />
          <Link href="/levels" className="rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur">
            {COPY.levelList}
          </Link>
        </div>
      </header>

      <p className="pointer-events-none absolute inset-x-0 bottom-8 z-10 mx-auto w-fit rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur">
        {COPY.campusHint}
      </p>
      <p className="pointer-events-none absolute bottom-1 right-2 z-10 text-[10px] text-slate-700/80">{attribution}</p>
    </>
  );
}
