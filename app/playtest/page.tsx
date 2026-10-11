import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Screen } from "@/components/ui/Screen";
import { COPY } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import { summarizePlaytest } from "@/lib/playtest/summary";
import { isDbConfigured, listPlaytestRuns } from "@/lib/server/db";
import PlaytestSetup from "./PlaytestSetup";

// หน้าสำหรับ Nut: ตั้งโหมดทดสอบ + ดูผลรอบ 1 vs รอบ 2 + ดาวน์โหลด CSV (ไม่ได้ลิงก์จากหน้าอื่น)
export default function PlaytestPage() {
  return (
    <Screen className="gap-4">
      <header>
        <h1 className="text-2xl font-bold">{COPY.playtestTitle}</h1>
        <p className="text-sm text-muted">{COPY.playtestHint}</p>
      </header>
      <PlaytestSetup />
      <Suspense fallback={<p className="animate-pulse text-muted">กำลังโหลดผล…</p>}>
        <Results />
      </Suspense>
    </Screen>
  );
}

async function Results() {
  await connection(); // อยู่นอก try ตามกติกา Cache Components
  if (!isDbConfigured()) return <p className="text-muted">{COPY.leaderboardDisabled}</p>;

  let runs;
  try {
    runs = await listPlaytestRuns();
  } catch (e) {
    console.error("[playtest] read failed:", e instanceof Error ? e.message : e);
    return <p className="text-danger">โหลดผลไม่สำเร็จ ลองรีเฟรชอีกครั้ง</p>;
  }
  if (runs.length === 0) return <p className="text-muted">{COPY.playtestNoRuns}</p>;

  const { rounds, testers } = summarizePlaytest(runs);
  const roundNumbers = rounds.map((r) => r.round);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold">{COPY.playtestResults}</h2>

      <div className="overflow-x-auto rounded-card bg-surface-raised p-4">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-left text-muted">
            <tr>
              <th className="pr-3 font-normal">รอบ</th>
              <th className="pr-3 font-normal">จำนวนสาย</th>
              <th className="pr-3 font-normal">คะแนนเฉลี่ย</th>
              <th className="pr-3 font-normal">วางช้าเฉลี่ย</th>
              <th className="font-normal">ยอมโอน</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r.round}>
                <td className="pr-3">{r.round}</td>
                <td className="pr-3">{r.runs}</td>
                <td className="pr-3">{r.avgScore}</td>
                <td className="pr-3">{r.avgLateSeconds} วิ</td>
                <td>{Math.round(r.compliedRate * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">
          &ldquo;วางช้า&rdquo; = วางสายหลังจุดที่ควรวางกี่วินาที (เทียบข้ามด่านได้ดีกว่าเวลาวางสายดิบ)
        </p>
      </div>

      <div className="overflow-x-auto rounded-card bg-surface-raised p-4">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-left text-muted">
            <tr>
              <th className="pr-3 font-normal">ผู้ทดสอบ</th>
              {roundNumbers.map((n) => (
                <th key={n} className="pr-3 font-normal">
                  รอบ {n} (คะแนน · วางที่)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {testers.map((t) => (
              <tr key={t.testerCode}>
                <td className="pr-3">{t.testerCode}</td>
                {roundNumbers.map((n) => {
                  const r = t.rounds[n];
                  return (
                    <td key={n} className="pr-3">
                      {r ? `${r.score} · ${formatClock(r.hangupT)}` : "–"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a
        href="/api/playtest/export"
        download
        className="rounded-card bg-surface-raised px-5 py-3 text-center font-medium"
      >
        {COPY.playtestExport}
      </a>
      <Link href="/levels" className="text-center underline">
        {COPY.backToLevels}
      </Link>
    </section>
  );
}
