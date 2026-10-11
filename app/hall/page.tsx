import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TitleChips } from "@/components/game/TitleChips";
import { Screen } from "@/components/ui/Screen";
import { COPY } from "@/lib/copy";
import { AVATARS, isAvatarId } from "@/lib/game/alias";
import { computeBoards, type BoardEntry } from "@/lib/game/boards";
import { listScenarios } from "@/lib/scenarios/load";
import { isDbConfigured } from "@/lib/server/db";
import { loadBoardData } from "@/lib/server/gameDb";

// Hall of Bangmod — บอร์ดทั้งหมด (docs/GAME_SPEC.md ข้อ 8) · แสดงแค่ฉายา/avatar/เลเวล ไม่มีชื่อจริง
export default function HallPage() {
  return (
    <Screen className="gap-4">
      <header>
        <h1 className="text-2xl font-bold">{COPY.hallTitle}</h1>
        <p className="text-sm text-muted">{COPY.hallHint}</p>
      </header>
      <Suspense fallback={<p className="animate-pulse text-muted">กำลังโหลด…</p>}>
        <Boards />
      </Suspense>
      <nav className="flex justify-between text-sm underline">
        <Link href="/campus">{COPY.backToCampus}</Link>
        <Link href="/me">{COPY.viewProfile}</Link>
      </nav>
    </Screen>
  );
}

function Board({ title, hint, entries, unit }: { title: string; hint: string; entries: BoardEntry[]; unit: string }) {
  return (
    <section className="rounded-card bg-surface-raised p-4">
      <h2 className="font-bold">{title}</h2>
      <p className="mb-2 text-xs text-muted">{hint}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">{COPY.boardEmpty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((e, i) => (
            <li key={`${e.alias}-${i}`} className="flex items-center gap-3">
              <span className="w-5 text-sm tabular-nums text-muted">{i + 1}</span>
              <span className="text-2xl" aria-hidden>
                {isAvatarId(e.avatar) ? AVATARS[e.avatar] : "👤"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{e.alias}</span>
                <span className="text-xs text-muted">Lv.{e.level}</span>
                <TitleChips titles={e.titles} className="mt-1" />
              </span>
              <span className="shrink-0 font-bold tabular-nums">
                {e.value}
                <span className="text-xs font-normal text-muted"> {unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

async function Boards() {
  await connection(); // อ่านตอน request เท่านั้น (อยู่นอก try ตามกติกา Cache Components)
  if (!isDbConfigured()) return <p className="text-muted">{COPY.leaderboardDisabled}</p>;

  const levels = listScenarios();
  let boards;
  try {
    const { playsByUser, profiles } = await loadBoardData();
    boards = computeBoards(playsByUser, profiles, levels.map((l) => l.id));
  } catch (e) {
    console.error("[hall] read failed:", e instanceof Error ? e.message : e);
    return <p className="text-danger">โหลดบอร์ดไม่สำเร็จ ลองรีเฟรชอีกครั้ง</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Board title={COPY.boardResilient} hint={COPY.boardResilientHint} entries={boards.resilient} unit="คะแนน" />
      <Board title={COPY.boardImproved} hint={COPY.boardImprovedHint} entries={boards.improved} unit="+" />
      <Board title={COPY.boardFunny} hint={COPY.boardFunnyHint} entries={boards.funny} unit="ครั้ง" />

      <section className="rounded-card bg-surface-raised p-4">
        <h2 className="mb-2 font-bold">{COPY.boardLevels}</h2>
        <ul className="flex flex-col gap-3 text-sm">
          {boards.levels.map((s) => (
            <li key={s.levelId}>
              <p className="font-medium">{levels.find((l) => l.id === s.levelId)?.title}</p>
              {s.plays === 0 ? (
                <p className="text-muted">ยังไม่มีใครเล่น</p>
              ) : (
                <>
                  <div className="my-1 h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
                    <div className="h-full bg-danger" style={{ width: `${s.scammedPercent}%` }} />
                  </div>
                  <p className="text-muted">
                    โดนหลอก {s.scammedPercent}% จาก {s.plays} สาย · วางช้าเฉลี่ย {s.avgLateSeconds} วิ
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
