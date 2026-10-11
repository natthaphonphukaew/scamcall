import type { AnalysisResult, CallSession, ScoreResult } from "@/lib/types";

// คะแนน — pure function (docs/SPEC.md ข้อ 5 · CLAUDE.md ข้อ 10)

/** เวลาผ่อนผันหลังประโยคอันตรายเริ่ม — ผู้เล่นต้องฟังจนจบประโยคก่อนถึงจะวางได้ */
export const HANG_UP_GRACE_SECONDS = 10;
export const LATE_SECONDS_PER_POINT = 2;
export const MIN_TIMING_SCORE = 40;
export const LEAK_PENALTY = 10;
export const CALLBACK_BONUS = 10;

export function gradeFor(score: number): ScoreResult["grade"] {
  if (score >= 90) return "strong";
  if (score >= 60) return "close";
  return "scammed";
}

export function computeScore(session: CallSession, analysis: AnalysisResult): ScoreResult {
  if (session.endedBy === "declined") {
    return { score: 100, grade: "strong", breakdown: [{ label: "ไม่รับสายตั้งแต่แรก", delta: 100 }] };
  }
  if (analysis.complied) {
    return {
      score: 0,
      grade: "scammed",
      breakdown: [{ label: "ยอมทำตามคำขอเงิน — ด่านล้มเหลว", delta: 0 }],
    };
  }

  const breakdown: ScoreResult["breakdown"] = [];
  const deadline = analysis.shouldHangUpAt + HANG_UP_GRACE_SECONDS;

  if (session.endedBy === "timeout") {
    breakdown.push({ label: "ไม่ได้วางสายเอง (ครบเวลา)", delta: MIN_TIMING_SCORE });
  } else if (session.hangupT <= deadline) {
    breakdown.push({ label: "วางสายทันเวลา", delta: 100 });
  } else {
    const late = session.hangupT - deadline;
    const timing = Math.max(MIN_TIMING_SCORE, 100 - Math.ceil(late / LATE_SECONDS_PER_POINT));
    breakdown.push({ label: `วางสายช้าไป ${Math.round(late)} วินาที`, delta: timing });
  }

  for (const item of analysis.leakedInfo) {
    breakdown.push({ label: `ข้อมูลหลุด: ${item}`, delta: -LEAK_PENALTY });
  }
  if (analysis.saidCallback) {
    breakdown.push({ label: "บอกว่าจะโทรกลับเบอร์ทางการ / 1441", delta: CALLBACK_BONUS });
  }

  const raw = breakdown.reduce((sum, b) => sum + b.delta, 0);
  const score = Math.min(100, Math.max(0, raw));
  return { score, grade: gradeFor(score), breakdown };
}
