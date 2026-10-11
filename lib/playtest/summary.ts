import type { PlaytestRun } from "@/lib/server/db";

// สรุปผลทดสอบกับเพื่อน: รอบ 1 vs รอบ 2 (CLAUDE.md ข้อ 11 Week 4) — pure function

export interface RoundStats {
  round: number;
  runs: number;
  avgScore: number;
  avgHangupT: number;
  /** วางสายช้ากว่าจุดที่ควรวางกี่วินาที (เฉลี่ย, 0 = ทันหรือก่อน) — เทียบข้ามด่านได้ดีกว่าเวลาวางสายดิบ */
  avgLateSeconds: number;
  /** สัดส่วนสายที่ผู้เล่นยอมทำตามคำขอเงิน (0–1) */
  compliedRate: number;
}

export interface TesterRow {
  testerCode: string;
  rounds: Record<number, { score: number; hangupT: number; lateSeconds: number } | undefined>;
}

export interface PlaytestSummary {
  rounds: RoundStats[];
  testers: TesterRow[];
}

export const lateSeconds = (r: Pick<PlaytestRun, "hangupT" | "shouldHangUpAt" | "endedBy">) =>
  r.endedBy === "declined" ? 0 : Math.max(0, r.hangupT - r.shouldHangUpAt);

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function summarizePlaytest(runs: PlaytestRun[]): PlaytestSummary {
  const roundNumbers = [...new Set(runs.map((r) => r.round))].sort((a, b) => a - b);

  const rounds: RoundStats[] = roundNumbers.map((round) => {
    const rs = runs.filter((r) => r.round === round);
    return {
      round,
      runs: rs.length,
      avgScore: round1(mean(rs.map((r) => r.score))),
      avgHangupT: round1(mean(rs.map((r) => r.hangupT))),
      avgLateSeconds: round1(mean(rs.map(lateSeconds))),
      compliedRate: round1(mean(rs.map((r) => (r.complied ? 1 : 0))) * 100) / 100,
    };
  });

  // ผู้ทดสอบคนหนึ่งเล่นหลายสายในรอบเดียวได้ → ใช้ค่าเฉลี่ยของรอบนั้น
  const codes = [...new Set(runs.map((r) => r.testerCode))].sort();
  const testers: TesterRow[] = codes.map((testerCode) => {
    const mine = runs.filter((r) => r.testerCode === testerCode);
    const roundsOf: TesterRow["rounds"] = {};
    for (const round of roundNumbers) {
      const rs = mine.filter((r) => r.round === round);
      if (rs.length === 0) continue;
      roundsOf[round] = {
        score: round1(mean(rs.map((r) => r.score))),
        hangupT: round1(mean(rs.map((r) => r.hangupT))),
        lateSeconds: round1(mean(rs.map(lateSeconds))),
      };
    }
    return { testerCode, rounds: roundsOf };
  });

  return { rounds, testers };
}

const CSV_HEADER = [
  "tester_code",
  "round",
  "level_id",
  "ended_by",
  "hangup_t",
  "should_hang_up_at",
  "late_seconds",
  "score",
  "grade",
  "complied",
  "leaked_count",
  "created_at",
];

function csvCell(v: string | number | boolean): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV พร้อม BOM ให้ Excel เปิดภาษาไทยถูก */
export function playtestCsv(runs: PlaytestRun[]): string {
  const lines = runs.map((r) =>
    [
      r.testerCode,
      r.round,
      r.levelId,
      r.endedBy,
      r.hangupT,
      r.shouldHangUpAt,
      round1(lateSeconds(r)),
      r.score,
      r.grade,
      r.complied,
      r.leakedCount,
      r.createdAt,
    ]
      .map(csvCell)
      .join(","),
  );
  return "﻿" + [CSV_HEADER.join(","), ...lines].join("\n") + "\n";
}
