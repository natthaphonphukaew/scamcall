import type { LevelInfo } from "@/lib/game/progression";

/** แถบ XP ของเลเวลปัจจุบัน */
export function XpBar({ level }: { level: LevelInfo }) {
  const pct = Math.min(100, Math.round((level.xpIntoLevel / level.xpForLevel) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <p className="font-bold">
          Lv.{level.level} · {level.title}
        </p>
        <p className="text-xs tabular-nums text-muted">
          {level.xpIntoLevel}/{level.xpForLevel} XP
        </p>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={level.xpForLevel}
        aria-valuenow={level.xpIntoLevel}
      >
        <div className="h-full rounded-full bg-accept transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
