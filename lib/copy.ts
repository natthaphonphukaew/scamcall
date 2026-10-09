import type { CallErrorCode } from "@/lib/live/LiveCallController";
import { SAFE_WORD } from "@/lib/live/constants";
import type { EndedBy, Speaker, TacticId } from "@/lib/types";

// ข้อความ UI ภาษาไทยที่ใช้ซ้ำ — แก้คำที่นี่ที่เดียว (docs/SPEC.md ข้อ 15)

export const COPY = {
  simulationBadge: "การจำลองเพื่อการฝึก",
  incoming: "สายเรียกเข้า…",
  answer: "รับสาย",
  decline: "ตัดสาย",
  hangUp: "วางสาย",
  connecting: "กำลังเชื่อมต่อ…",
  scammerSpeaking: "ปลายสายกำลังพูด",
  listening: "กำลังฟังคุณ",
  autoHangUpIn: "ตัดสายอัตโนมัติใน",
  safeWordHint: `พูดว่า "${SAFE_WORD}" หรือกดวางสายได้ทุกเมื่อ`,
  transcriptEmpty: "บทสนทนาจะขึ้นตรงนี้",
  ended: "วางสายแล้ว",
  callLength: "ความยาวสาย",
  leaked: "ข้อมูลที่ดูเหมือนข้อมูลจริง (ถูกซ่อนแล้ว)",
  restart: "ลองรับสายใหม่",
  xrayComingSoon: "Scam X-Ray และคะแนน จะมาใน Week 3",
} as const;

export const SPEAKER_LABELS: Record<Speaker, string> = {
  scammer: "ปลายสาย",
  player: "คุณ",
};

export const ERROR_MESSAGES: Record<CallErrorCode, string> = {
  mic_denied: "ยังไม่ได้รับสิทธิ์ใช้ไมค์ — กดไอคอนข้างแถบที่อยู่เว็บ อนุญาตไมโครโฟน แล้วกดรับสายอีกครั้ง",
  rate_limited: "ระบบไม่ว่าง ลองใหม่ในอีก 1 นาที",
  token_failed: "ตอนนี้เชื่อมต่อ AI ไม่ได้ (โควตาอาจเต็ม) ลองใหม่อีกครั้ง",
  connect_failed: "ต่อสายไม่ติด ลองใหม่อีกครั้ง",
  disconnected: "สายหลุดกลางทาง",
  backgrounded: "ระบบวางสายให้ เพราะออกจากแอปนานเกิน 10 วินาที",
};

export const ENDED_BY_LABELS: Record<EndedBy, string> = {
  player: "คุณวางสายเอง",
  timeout: "ครบเวลา ระบบตัดสายให้",
  error: "สายถูกตัด",
  declined: "คุณไม่รับสายตั้งแต่แรก — ปลอดภัยที่สุด!",
};

/** ป้ายเทคนิคสำหรับ Scam X-Ray (CLAUDE.md ข้อ 9) */
export const TACTIC_LABELS: Record<TacticId, string> = {
  authority: "อ้างอำนาจ",
  fear: "สร้างความกลัว",
  urgency: "เร่งเวลา",
  isolation: "ตัดขาดจากคนอื่น",
  legitimacy: "สร้างความน่าเชื่อ",
  info_request: "ขอข้อมูล",
  money_request: "ขอให้โอน",
  rapport: "ทำทีเป็นมิตร",
};
