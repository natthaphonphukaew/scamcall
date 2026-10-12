/** 75 → "1:15" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** ตัวอักษรบนรูปโปรไฟล์: พยัญชนะ/ตัวอักษรตัวแรก — ข้ามสระหน้าอย่าง "แ" ใน "แอดมิน" หรือ "โ" ใน "โค้ช" */
export function initialOf(name: string): string {
  return Array.from(name).find((ch) => /[ก-ฮA-Za-z0-9]/.test(ch)) ?? "?";
}
