import type { RedactionType, TacticId } from "@/lib/types";

// taxonomy ของ Scam X-Ray (CLAUDE.md ข้อ 9) — ใช้ทั้งใน prompt, schema และการตรวจผล

export const TACTIC_IDS: readonly TacticId[] = [
  "authority",
  "fear",
  "urgency",
  "isolation",
  "legitimacy",
  "info_request",
  "money_request",
  "rapport",
];

export const TACTIC_DEFINITIONS: Record<TacticId, string> = {
  authority: "อ้างอำนาจ — อ้างตำแหน่ง หน่วยงาน หรือยศ",
  fear: "สร้างความกลัว — ขู่คดี จับกุม อายัดบัญชี เงินหาย",
  urgency: "เร่งเวลา — ต้องทำภายในวันนี้/ตอนนี้",
  isolation: "ตัดขาดจากคนอื่น — ห้ามวางสาย ห้ามบอกใคร อ้างความลับทางคดี",
  legitimacy: "สร้างความน่าเชื่อ — เลขคดี ชื่อเจ้าหน้าที่ โอนสายไปหาหัวหน้า",
  info_request: "ขอข้อมูล — ถามข้อมูลส่วนตัวหรือการเงิน",
  money_request: "ขอให้โอน — โอนเพื่อตรวจสอบ บัญชีปลอดภัย ค่าธรรมเนียม ติดตั้งแอปจากลิงก์",
  rapport: "ทำทีเป็นมิตร — ช่วยเหลือ เห็นใจ \"พี่จะช่วยน้อง\" แจ้งข่าวดี",
};

/** หมวดข้อมูลที่ "หลุด" — ใช้ enum เพื่อให้นับคะแนนได้สม่ำเสมอ */
export const LEAK_CATEGORIES = [
  "ชื่อ-นามสกุล",
  "ธนาคารที่ใช้",
  "ยอดเงินในบัญชี",
  "เลขบัญชี",
  "เลขบัตร",
  "รหัส OTP",
  "เลขบัตรประชาชน",
  "เบอร์โทร",
  "ที่อยู่",
  "สถานศึกษา/ที่ทำงาน",
] as const;

export type LeakCategory = (typeof LEAK_CATEGORIES)[number];

/** ตัวเลขที่ mask จับได้ในคำพูดผู้เล่น = ข้อมูลหลุดแน่นอน (ไม่ต้องพึ่ง AI) */
export const REDACTION_TO_LEAK: Record<RedactionType, LeakCategory> = {
  national_id: "เลขบัตรประชาชน",
  bank_account: "เลขบัญชี",
  card_number: "เลขบัตร",
  otp: "รหัส OTP",
  phone: "เบอร์โทร",
};
