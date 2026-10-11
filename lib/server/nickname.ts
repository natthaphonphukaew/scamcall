import { maskSensitive } from "@/lib/privacy/mask";

// ตรวจชื่อเล่นก่อนขึ้น leaderboard (จะถูกฉายหน้าห้อง)
// ไม่ได้กันได้ทุกคำ — ถ้าหลุด ลบแถวได้ใน Supabase Dashboard → Table editor → leaderboard

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

const BLOCKED = ["ควย", "เหี้ย", "สัส", "เย็ด", "หี", "แตด", "fuck", "shit", "bitch", "dick", "porn", "nazi"];

/** control chars + zero-width/bidi marks (สร้างจากรหัส เพื่อไม่ให้มีตัวอักษรล่องหนอยู่ในไฟล์) */
const range = (from: number, to: number) => `${String.fromCharCode(from)}-${String.fromCharCode(to)}`;
const INVISIBLE_CHARS = new RegExp(
  `[${range(0x00, 0x1f)}${range(0x7f, 0x7f)}${range(0x200b, 0x200f)}${range(0x2028, 0x202f)}${range(0x2060, 0x206f)}${range(0xfeff, 0xfeff)}]`,
  "g",
);

/** คืนชื่อที่ทำความสะอาดแล้ว หรือ null ถ้าใช้ไม่ได้ */
export function normalizeNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw
    .normalize("NFC")
    .replace(INVISIBLE_CHARS, "") // control / zero-width
    .replace(/\s+/g, " ")
    .trim();

  const length = [...name].length;
  if (length < NICKNAME_MIN || length > NICKNAME_MAX) return null;

  const lower = name.toLowerCase().replace(/\s/g, "");
  if (BLOCKED.some((w) => lower.includes(w))) return null;

  // ห้ามใช้ชื่อที่ดูเหมือนเบอร์โทร/เลขบัตร (ความเป็นส่วนตัว)
  if (maskSensitive(name).redactions.length > 0 || /\d{6,}/.test(name.replace(/\D/g, ""))) return null;

  return name;
}

/** รหัสผู้ทดสอบ เช่น "p01" → "P01" */
export function normalizeTesterCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{1,12}$/.test(code) ? code : null;
}
