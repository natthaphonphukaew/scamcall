import { maskSensitive } from "@/lib/privacy/mask";
import type { CallSession, EndedBy, RedactionType, TranscriptTurn } from "@/lib/types";

// ตรวจ body ของ POST /api/analyze — ข้อมูลมาจาก browser จึงไม่เชื่อ type

export const MAX_TURNS = 200;
export const MAX_TURN_CHARS = 1000;
const ENDED_BY: readonly EndedBy[] = ["player", "timeout", "error", "declined"];

export class BadSessionError extends Error {}

const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * แปลง body เป็น CallSession ที่เชื่อได้
 * - mask ข้อความซ้ำฝั่ง server (เผื่อ client ไม่ได้ mask) และรวม redactions ที่ client ส่งมา
 * - ตัดข้อความที่ยาวเกิน กัน prompt ใหญ่ผิดปกติ
 */
export function parseCallSession(raw: unknown): CallSession {
  if (typeof raw !== "object" || raw === null) throw new BadSessionError("body must be an object");
  const r = raw as Record<string, unknown>;

  for (const f of ["sessionId", "levelId", "startedAt", "endedAt"] as const) {
    if (!isStr(r[f]) || r[f].length === 0 || r[f].length > 100) throw new BadSessionError(`${f} invalid`);
  }
  if (!ENDED_BY.includes(r.endedBy as EndedBy)) throw new BadSessionError("endedBy invalid");
  if (!isNum(r.hangupT) || r.hangupT < 0) throw new BadSessionError("hangupT invalid");
  if (!Array.isArray(r.turns) || r.turns.length > MAX_TURNS) throw new BadSessionError("turns invalid");

  const turns: TranscriptTurn[] = r.turns.map((rawTurn, i) => {
    const t = rawTurn as Record<string, unknown>;
    if (t.speaker !== "scammer" && t.speaker !== "player") throw new BadSessionError(`turn ${i} speaker invalid`);
    if (!isNum(t.t) || t.t < 0) throw new BadSessionError(`turn ${i} t invalid`);
    if (!isStr(t.text)) throw new BadSessionError(`turn ${i} text invalid`);

    const masked = maskSensitive(t.text.slice(0, MAX_TURN_CHARS));
    const clientRedactions = Array.isArray(t.redactions) ? (t.redactions as RedactionType[]) : [];
    const redactions = [...new Set([...clientRedactions, ...masked.redactions])].filter(
      (x): x is RedactionType => ["national_id", "bank_account", "card_number", "otp", "phone"].includes(x),
    );
    return { id: String(i), t: t.t, speaker: t.speaker, text: masked.text, redactions };
  });

  return {
    sessionId: r.sessionId as string,
    levelId: r.levelId as string,
    startedAt: r.startedAt as string,
    endedAt: r.endedAt as string,
    endedBy: r.endedBy as EndedBy,
    hangupT: r.hangupT,
    turns,
  };
}
