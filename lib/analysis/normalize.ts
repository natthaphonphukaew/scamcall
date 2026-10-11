import type { AnalysisResult, AnalyzedTurn, CallSession, TacticId } from "@/lib/types";
import type { RawAnalysis } from "./schema";
import { LEAK_CATEGORIES, REDACTION_TO_LEAK, TACTIC_IDS, type LeakCategory } from "./taxonomy";

// แปลงคำตอบของโมเดล (อาจผิดได้) + transcript จริง → AnalysisResult ที่เชื่อได้
// ข้อความ/เวลา/ผู้พูดมาจาก session เสมอ — โมเดลให้แค่ป้ายและตัวเลข

const MAX_TIPS = 4;

function clampPressure(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.min(10, Math.max(0, Math.round(v)));
}

function validTactics(v: unknown): TacticId[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is TacticId => TACTIC_IDS.includes(x as TacticId)))];
}

/** ข้อมูลที่หลุดแน่นอนจากตัวเลขที่ mask จับได้ในคำพูดผู้เล่น */
export function leaksFromRedactions(session: CallSession): LeakCategory[] {
  return session.turns
    .filter((t) => t.speaker === "player")
    .flatMap((t) => t.redactions.map((r) => REDACTION_TO_LEAK[r]));
}

export function normalizeAnalysis(raw: RawAnalysis, session: CallSession): AnalysisResult {
  const byIndex = new Map<number, { tactics: TacticId[]; pressure: number | null }>();
  for (const item of Array.isArray(raw.scammerTurns) ? raw.scammerTurns : []) {
    if (typeof item?.index !== "number") continue;
    byIndex.set(item.index, { tactics: validTactics(item.tactics), pressure: clampPressure(item.pressure) });
  }

  // ผู้เล่นไม่มีป้าย และใช้ความกดดันล่าสุดของคนร้าย (กราฟต่อเนื่อง)
  let lastPressure = 0;
  const turns: AnalyzedTurn[] = session.turns.map((turn, i) => {
    if (turn.speaker === "scammer") {
      const m = byIndex.get(i);
      lastPressure = m?.pressure ?? lastPressure;
      return { t: turn.t, speaker: turn.speaker, text: turn.text, tactics: m?.tactics ?? [], pressure: lastPressure };
    }
    return { t: turn.t, speaker: turn.speaker, text: turn.text, tactics: [], pressure: lastPressure };
  });

  const leaked = new Set<LeakCategory>(leaksFromRedactions(session));
  if (Array.isArray(raw.leakedInfo)) {
    for (const x of raw.leakedInfo) if (LEAK_CATEGORIES.includes(x as LeakCategory)) leaked.add(x as LeakCategory);
  }

  const tips = Array.isArray(raw.tips)
    ? raw.tips.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
    : [];

  return {
    turns,
    shouldHangUpAt: resolveShouldHangUpAt(raw.shouldHangUpIndex, turns),
    leakedInfo: LEAK_CATEGORIES.filter((c) => leaked.has(c)),
    complied: raw.complied === true,
    saidCallback: raw.saidCallback === true,
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    tips: tips.slice(0, MAX_TIPS),
  };
}

/**
 * เวลาที่ควรวางสาย = เวลาเริ่มของประโยคคนร้ายที่โมเดลเลือก
 * ถ้าโมเดลชี้ผิด (ไม่ใช่ประโยคคนร้าย/เกินช่วง) → ประโยคคนร้ายแรกที่ pressure ≥ 5 → ประโยคคนร้ายแรก → 0
 */
function resolveShouldHangUpAt(index: unknown, turns: AnalyzedTurn[]): number {
  if (typeof index === "number" && Number.isInteger(index)) {
    const picked = turns[index];
    if (picked?.speaker === "scammer") return picked.t;
    const next = turns.slice(Math.max(0, index)).find((t) => t.speaker === "scammer");
    if (next) return next.t;
  }
  const scammer = turns.filter((t) => t.speaker === "scammer");
  return (scammer.find((t) => t.pressure >= 5) ?? scammer[0])?.t ?? 0;
}

/** สายที่ไม่มีคำพูดคนร้ายเลย (ไม่รับสาย/วางทันที) — ไม่ต้องเรียกโมเดล */
export function emptyAnalysis(session: CallSession): AnalysisResult {
  const declined = session.endedBy === "declined";
  return {
    turns: session.turns.map((t) => ({ t: t.t, speaker: t.speaker, text: t.text, tactics: [], pressure: 0 })),
    shouldHangUpAt: 0,
    leakedInfo: LEAK_CATEGORIES.filter((c) => leaksFromRedactions(session).includes(c)),
    complied: false,
    saidCallback: false,
    summary: declined
      ? "คุณไม่รับสายจากเบอร์ที่อ้างเป็นหน่วยงาน — นี่คือวิธีที่ปลอดภัยที่สุด"
      : "สายจบก่อนที่ปลายสายจะพูดอะไร จึงยังไม่มีบทสนทนาให้วิเคราะห์",
    tips: ["ถ้าสงสัยว่าเป็นหน่วยงานจริง ให้โทรกลับเบอร์ทางการที่ค้นเอง หรือโทร 1441"],
  };
}
