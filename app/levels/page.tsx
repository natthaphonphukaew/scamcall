import Link from "next/link";
import { PlayerChip } from "@/components/game/PlayerChip";
import { PlaytestBadge } from "@/components/playtest/PlaytestBadge";
import { Screen } from "@/components/ui/Screen";
import { COPY, DIFFICULTY_LABELS } from "@/lib/copy";
import { listScenarios, toPublicScenario } from "@/lib/scenarios/load";

// เลือกด่าน — static ทั้งหน้า (ด่านรู้ตั้งแต่ build) ส่งแค่ข้อมูล public
// Week 2: โครงเรียบ — ดีไซน์จริงทำทีหลัง
export default function LevelsPage() {
  const levels = listScenarios().map(toPublicScenario);

  return (
    <Screen className="gap-4">
      <PlaytestBadge />
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{COPY.levelsTitle}</h1>
          <p className="text-sm text-muted">{COPY.levelsHint}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <PlayerChip />
          <Link href="/hall" className="rounded-full bg-surface-raised px-3 py-1 text-sm">
            🏆 Hall
          </Link>
        </div>
      </header>

      <ol className="flex flex-col gap-3">
        {levels.map((level, i) => (
          <li key={level.id}>
            <Link
              href={`/call/${level.id}`}
              className="flex items-center justify-between gap-3 rounded-card bg-surface-raised p-4 active:scale-[0.99]"
            >
              <div>
                <p className="text-xs text-muted">ด่าน {i + 1}</p>
                <p className="font-medium">{level.title}</p>
                <p className="text-sm text-muted">{level.callerId}</p>
              </div>
              <span className="shrink-0 text-sm text-scammer">
                {"★".repeat(level.difficulty)}
                {"☆".repeat(3 - level.difficulty)} {DIFFICULTY_LABELS[level.difficulty]}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Screen>
  );
}
