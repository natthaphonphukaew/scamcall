import type { CallErrorCode } from "@/lib/live/LiveCallController";
import { SAFE_WORD } from "@/lib/live/constants";
import type { EndedBy, ScoreResult, Speaker, TacticId } from "@/lib/types";

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
  speakingNow: "กำลังพูด…",
  ended: "วางสายแล้ว",
  callLength: "ความยาวสาย",
  leaked: "ข้อมูลที่ดูเหมือนข้อมูลจริง (ถูกซ่อนแล้ว)",
  restart: "ลองรับสายใหม่",
  backToLevels: "เลือกด่านอื่น",
  notSaved: "บทสนทนานี้ไม่ได้ถูกบันทึก เพราะคุณไม่ได้ยินยอมให้เก็บ",

  appName: "ScamCall",
  tagline: "วัคซีนมิจฉาชีพ — โดนหลอกแบบปลอดภัย ก่อนเจอของจริง",
  consentTitle: "ก่อนเริ่มฝึก",
  consentAcknowledge:
    "ฉันเข้าใจว่านี่คือการจำลองเพื่อการฝึก ปลายสายคือ AI และเสียงที่พูดจะถูกส่งไปประมวลผลที่ Google",
  consentAdult: "ฉันอายุ 18 ปีขึ้นไป",
  consentSaveTranscript:
    "เก็บบทสนทนา (ที่ซ่อนตัวเลขสำคัญแล้ว) ไว้ในเครื่องนี้ และส่งให้ AI วิเคราะห์เป็น Scam X-Ray หลังวางสาย (ไม่บังคับ)",
  startTraining: "เริ่มฝึก",

  openXRay: "ดู Scam X-Ray",
  xrayTitle: "Scam X-Ray",
  analyzing: "กำลังวิเคราะห์สาย…",
  analyzeFailed: "วิเคราะห์ไม่สำเร็จ (โควตา AI อาจเต็ม)",
  retry: "ลองใหม่",
  sessionMissing: "ไม่พบผลของสายนี้ — อาจปิดแท็บไปแล้ว หรือไม่ได้ยินยอมให้เก็บบทสนทนา",
  scoreTitle: "คะแนน",
  pressureTitle: "ระดับความกดดันตลอดสาย",
  pressureCaption: "0 = คุยทั่วไป · 10 = ขู่ + เร่ง + ขอเงินพร้อมกัน",
  shouldHangUpHere: "ควรวางสายตรงนี้",
  youHungUp: "คุณวางสาย",
  timelineTitle: "ไทม์ไลน์บทสนทนา",
  leakedTitle: "ข้อมูลที่หลุดออกไป",
  noLeaks: "ไม่มีข้อมูลหลุด",
  lessonsTitle: "บทเรียน",
  correctExitTitle: "สิ่งที่ถูกต้องที่สุด",
  pressureLabel: "ความกดดัน",

  leaderboardTitle: "Leaderboard",
  leaderboardHint: "ส่งแค่ชื่อเล่น + คะแนน + เวลาวางสาย — ไม่ส่งบทสนทนา",
  nicknamePlaceholder: "ชื่อเล่น (2–20 ตัวอักษร)",
  submitScore: "ส่งคะแนน",
  leaderboardEmpty: "ยังไม่มีใครส่งคะแนนในด่านนี้",
  leaderboardDisabled: "ยังไม่ได้เปิดใช้ leaderboard (ยังไม่ได้ตั้งค่า database)",
  viewLeaderboard: "ดู Leaderboard",
  hangupAt: "วางสายที่",

  playtestTitle: "โหมดทดสอบกับเพื่อน",
  playtestHint: "ตั้งรหัสผู้ทดสอบ (เช่น P01 — ไม่ใช่ชื่อจริง) และรอบ ก่อนส่งเครื่องให้เพื่อนเล่น ผลจะถูกส่งให้อัตโนมัติหลังดู X-Ray",
  playtestCode: "รหัสผู้ทดสอบ",
  playtestRound: "รอบ",
  playtestStart: "เริ่มโหมดทดสอบ",
  playtestStop: "ปิดโหมดทดสอบ",
  playtestActive: "โหมดทดสอบ",
  playtestResults: "ผลรอบ 1 vs รอบ 2",
  playtestExport: "ดาวน์โหลด CSV",
  playtestNoRuns: "ยังไม่มีผลทดสอบ",
  playtestSentLabel: "ส่งผลทดสอบแล้ว",
  playtestSendingLabel: "กำลังส่งผลทดสอบ…",
  playtestErrorLabel: "ส่งผลทดสอบไม่สำเร็จ",

  levelsTitle: "เลือกด่าน",
  levelsHint: "แต่ละด่านจำลองรูปแบบการหลอกที่เกิดขึ้นจริง — วางสายให้เร็วที่สุดเมื่อรู้ตัว",
} as const;

/** ข้อความแจ้งก่อนเริ่ม (CLAUDE.md ข้อ 7.3) */
export const DISCLAIMER_POINTS = [
  "นี่คือการจำลองเพื่อการฝึกเท่านั้น ปลายสายคือ AI ที่เล่นบทมิจฉาชีพ",
  "ไม่มีการโทรออกจริง และไม่ต้องใช้ข้อมูลจริงของคุณ — ถ้าต้องตอบ ให้แต่งข้อมูลขึ้นมาเอง",
  `วางสายได้ทุกเมื่อ หรือพูดว่า "${SAFE_WORD}" ถ้ารู้สึกไม่สบายใจ`,
  "แอปนี้ไม่บันทึกเสียงของคุณ แต่เสียงและบทสนทนาถูกส่งไปประมวลผลที่ Google Gemini (บริการฟรี) ซึ่ง Google อาจนำไปใช้ปรับปรุงบริการ และอาจมีเจ้าหน้าที่ตรวจอ่าน — อย่าพูดข้อมูลจริงหรือข้อมูลส่วนตัวใดๆ",
  "ใช้ได้เฉพาะผู้ที่อายุ 18 ปีขึ้นไป (ตามเงื่อนไขของ Gemini API)",
] as const;

export const GRADE_LABELS: Record<ScoreResult["grade"], string> = {
  strong: "ภูมิคุ้มกันแกร่ง",
  close: "รอดแบบเฉียดฉิว",
  scammed: "โดนหลอกแล้ว",
};

/** ข้อความผลการส่งคะแนน — key ตรงกับ SubmitOutcome ใน lib/results/client.ts */
export const SUBMIT_MESSAGES = {
  sent: "ส่งแล้ว!",
  duplicate: "สายนี้ส่งไปแล้ว",
  bad_nickname: "ใช้ชื่อนี้ไม่ได้ ลองชื่ออื่น (ห้ามคำหยาบ/ตัวเลขยาวๆ)",
  disabled: "ยังไม่ได้เปิดใช้ (ยังไม่ได้ตั้งค่า database)",
  error: "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง",
} as const;

export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: "ง่าย",
  2: "กลาง",
  3: "ยาก",
};

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
