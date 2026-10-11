import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Screen } from "@/components/ui/Screen";
import { COPY } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import { listScenarios } from "@/lib/scenarios/load";
import { isDbConfigured, topScores } from "@/lib/server/db";

// Leaderboard — อ่านจาก Supabase ตอนมี request (ไม่ prerender) · Week 4: โครงเรียบ
export default function LeaderboardPage() {
  return (
    <Screen className="gap-4">
      <header>
        <h1 className="text-2xl font-bold">{COPY.leaderboardTitle}</h1>
        <p className="text-sm text-muted">คะแนนสูงสุดของแต่ละด่าน — เสมอกัน ใครวางสายเร็วกว่าได้อันดับดีกว่า</p>
      </header>
      <Suspense fallback={<p className="animate-pulse text-muted">กำลังโหลด…</p>}>
        <Boards />
      </Suspense>
      <Link href="/levels" className="text-center underline">
        {COPY.backToLevels}
      </Link>
    </Screen>
  );
}

async function Boards() {
  await connection(); // ข้อมูลเปลี่ยนตลอด — อ่านตอน request เท่านั้น (อยู่นอก try ตามกติกา Cache Components)
  if (!isDbConfigured()) return <p className="text-muted">{COPY.leaderboardDisabled}</p>;

  let byLevel;
  try {
    byLevel = await topScores(10);
  } catch (e) {
    console.error("[leaderboard] read failed:", e instanceof Error ? e.message : e);
    return <p className="text-danger">โหลด leaderboard ไม่สำเร็จ ลองรีเฟรชอีกครั้ง</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {listScenarios().map((level) => {
        const rows = byLevel.get(level.id) ?? [];
        return (
          <section key={level.id} className="rounded-card bg-surface-raised p-4">
            <h2 className="font-bold">{level.title}</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-muted">{COPY.leaderboardEmpty}</p>
            ) : (
              <ol className="mt-2 flex flex-col gap-1 text-sm">
                {rows.map((row, i) => (
                  <li key={`${row.nickname}-${row.createdAt}`} className="flex items-center gap-3">
                    <span className="w-6 tabular-nums text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{row.nickname}</span>
                    <span className="tabular-nums text-muted">
                      {COPY.hangupAt} {formatClock(row.hangupT)}
                    </span>
                    <span className="w-10 text-right font-bold tabular-nums">{row.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
