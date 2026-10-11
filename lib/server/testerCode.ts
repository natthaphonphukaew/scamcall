// รหัสผู้ทดสอบของโหมด playtest (ไม่ใช่ชื่อจริง)
// ชื่อที่แสดงบนบอร์ดเกมใช้ฉายาจากชิ้นส่วนที่กำหนด (lib/game/alias.ts) — ไม่มีข้อความอิสระให้ต้องกรอง

/** "p01" → "P01" */
export function normalizeTesterCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{1,12}$/.test(code) ? code : null;
}
