import { LEAK_CATEGORIES, TACTIC_IDS } from "./taxonomy";

/**
 * JSON schema ที่บังคับให้ Gemini ตอบ (responseJsonSchema)
 * โมเดลตอบแค่ "เลข index ของประโยค" + ป้าย — ข้อความ/เวลาจริง server ดึงจาก transcript เอง
 * (กันโมเดลแต่งบทสนทนา และประหยัด token) จากนั้น normalizeAnalysis แปลงเป็น AnalysisResult
 */
export const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    scammerTurns: {
      type: "array",
      description: "หนึ่งรายการต่อทุกประโยคของคนร้าย (speaker = คนร้าย)",
      items: {
        type: "object",
        properties: {
          index: { type: "integer", description: "เลข [index] ของประโยคใน transcript" },
          tactics: { type: "array", items: { type: "string", enum: [...TACTIC_IDS] } },
          pressure: { type: "integer", minimum: 0, maximum: 10 },
        },
        required: ["index", "tactics", "pressure"],
      },
    },
    shouldHangUpIndex: {
      type: "integer",
      description: "index ของประโยคคนร้ายประโยคแรกที่ผู้เล่นควรวางสายทันที",
    },
    leakedInfo: { type: "array", items: { type: "string", enum: [...LEAK_CATEGORIES] } },
    complied: { type: "boolean", description: "ผู้เล่นตกลงจะโอนเงิน/ติดตั้งแอป/ทำตามคำขอเงิน" },
    saidCallback: { type: "boolean", description: "ผู้เล่นบอกว่าจะวางสายแล้วโทรกลับเบอร์ทางการหรือ 1441" },
    summary: { type: "string" },
    tips: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
  },
  required: ["scammerTurns", "shouldHangUpIndex", "leakedInfo", "complied", "saidCallback", "summary", "tips"],
} as const;

/** รูปที่โมเดลตอบ (ก่อนตรวจ — อาจผิดได้ทุก field) */
export interface RawAnalysis {
  scammerTurns?: { index?: unknown; tactics?: unknown; pressure?: unknown }[];
  shouldHangUpIndex?: unknown;
  leakedInfo?: unknown;
  complied?: unknown;
  saidCallback?: unknown;
  summary?: unknown;
  tips?: unknown;
}
