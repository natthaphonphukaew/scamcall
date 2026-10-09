import type { RedactionType } from "@/lib/types";

// Mask ข้อมูลที่ดูเหมือนข้อมูลจริงก่อนเก็บ transcript — ดู docs/SPEC.md ข้อ 6 และ CLAUDE.md ข้อ 7.2
// เก็บแค่ "ประเภท" ที่หลุด ไม่เก็บค่าจริง

export const REDACTION_LABELS: Record<RedactionType, string> = {
  national_id: "[เลขบัตรประชาชน]",
  bank_account: "[เลขบัญชี]",
  card_number: "[เลขบัตร]",
  otp: "[รหัส OTP]",
  phone: "[เบอร์โทร]",
};

// สายด่วนทางการ — ต้องเห็นใน transcript เสมอ (เป็นคำตอบที่ถูก!)
const HOTLINES = new Set(["1441", "1599", "1213", "1111", "1202"]);

// ตัวเลขที่คั่นด้วยเว้นวรรค ขีด หรือจุด (ตัวเดียว) ถือเป็นก้อนเดียว เช่น 1-2345-67890-12-3, 081 234 5678
const DIGIT_GROUP = /\d(?:[ \-.]?\d)+/g;

const OTP_CONTEXT = /otp|โอทีพี|รหัส|พิน|pin|พาสเวิร์ด|password/i;
const OTP_CONTEXT_WINDOW = 20;

const THAI_DIGIT_ZERO = 0x0e50; // ๐

/** แปลงเลขไทย ๐–๙ เป็น 0–9 — ความยาว string เท่าเดิม (index ตรงกัน) */
export function normalizeThaiDigits(text: string): string {
  return text.replace(/[๐-๙]/g, (d) => String(d.charCodeAt(0) - THAI_DIGIT_ZERO));
}

function classify(digits: string, hasOtpContext: boolean): RedactionType | null {
  if (HOTLINES.has(digits)) return null;
  const n = digits.length;
  if (n === 9 && digits.startsWith("0")) return "phone"; // เบอร์บ้าน 02-xxx-xxxx
  if (n === 10 && /^0[689]/.test(digits)) return "phone"; // มือถือ
  if (n >= 10 && n <= 12) return "bank_account";
  if (n === 13) return "national_id";
  if (n >= 14) return "card_number";
  if (n >= 4 && n <= 6 && hasOtpContext) return "otp";
  return null;
}

export interface MaskResult {
  text: string;
  redactions: RedactionType[];
}

export function maskSensitive(text: string): MaskResult {
  const normalized = normalizeThaiDigits(text);
  const found = new Set<RedactionType>();
  let out = "";
  let cursor = 0;

  for (const match of normalized.matchAll(DIGIT_GROUP)) {
    const start = match.index;
    const end = start + match[0].length;
    const digits = match[0].replace(/\D/g, "");
    const around = normalized.slice(
      Math.max(0, start - OTP_CONTEXT_WINDOW),
      Math.min(normalized.length, end + OTP_CONTEXT_WINDOW),
    );
    const type = classify(digits, OTP_CONTEXT.test(around));
    if (!type) continue;

    found.add(type);
    out += text.slice(cursor, start) + REDACTION_LABELS[type];
    cursor = end;
  }

  out += text.slice(cursor);
  return { text: out, redactions: [...found] };
}
