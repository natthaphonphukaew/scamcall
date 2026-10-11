import type { AliasParts } from "./types";

// ฉายา = ชื่อที่แสดงบนบอร์ด ประกอบจากชิ้นส่วนที่กำหนดไว้เท่านั้น (GAME_SPEC ข้อ 6)
// ไม่มีข้อความอิสระ → ไม่ต้องกรองคำหยาบ และระบุตัวคนไม่ได้
// เพิ่มชิ้นส่วนได้ แต่ห้ามลบ/สลับลำดับ (โปรไฟล์เก็บเป็น index) และห้ามคำเสียดสีกลุ่มคน

export const ALIAS_PREFIXES = [
  "ท่าน",
  "จอมยุทธ์",
  "ยอดนักสืบ",
  "อัศวิน",
  "เซียน",
  "ปรมาจารย์",
  "ผู้กล้า",
  "ตำนาน",
  "ซุปตาร์",
  "น้องใหม่",
] as const;

export const ALIAS_IDENTITIES = [
  "ผู้ใจบุญ",
  "สายตัดไว",
  "หูทิพย์",
  "ใจเย็น",
  "ปากแข็ง",
  "ตาไว",
  "นักวางสาย",
  "ผู้ไม่โอน",
  "สายมูเตลู",
  "ขี้สงสัย",
  "จอมเช็ก",
  "มือถือร้อน",
] as const;

export const ALIAS_SUFFIXES = [
  "แห่งบางมด",
  "ไร้เทียมทาน",
  "ประจำโรงอาหาร",
  "แห่งหอสมุด",
  "ผู้ไม่หลับใหล",
  "สายด่วน 1441",
  "แห่งตึกเรียน",
  "ผู้มาก่อนกาล",
  "ใจเกินร้อย",
  "ขวัญใจมิจฉาชีพ",
] as const;

const PART_LISTS = [ALIAS_PREFIXES, ALIAS_IDENTITIES, ALIAS_SUFFIXES] as const;

export function isValidAliasParts(v: unknown): v is AliasParts {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    v.every((n, i) => Number.isInteger(n) && n >= 0 && n < PART_LISTS[i].length)
  );
}

export function formatAlias(parts: AliasParts): string {
  return `${ALIAS_PREFIXES[parts[0]]} ${ALIAS_IDENTITIES[parts[1]]} ${ALIAS_SUFFIXES[parts[2]]}`;
}

/** @param random แทนที่ได้ตอน test */
export function randomAliasParts(random: () => number = Math.random): AliasParts {
  return PART_LISTS.map((list) => Math.floor(random() * list.length)) as AliasParts;
}

/** สุ่มใหม่เฉพาะช่องเดียว (ปุ่ม 🎲 ข้างแต่ละช่อง) — รับประกันว่าได้ค่าใหม่ */
export function rerollAliasPart(parts: AliasParts, slot: 0 | 1 | 2, random: () => number = Math.random): AliasParts {
  const size = PART_LISTS[slot].length;
  const next = [...parts] as AliasParts;
  next[slot] = (parts[slot] + 1 + Math.floor(random() * (size - 1))) % size;
  return next;
}

/** avatar ชั่วคราวเป็น emoji — Phase 2 เปลี่ยนเป็นตัวละคร chibi โดยใช้ id เดิม */
export const AVATARS = {
  cat: "🐱",
  dog: "🐶",
  fox: "🦊",
  panda: "🐼",
  frog: "🐸",
  penguin: "🐧",
  owl: "🦉",
  tiger: "🐯",
} as const;

export type AvatarId = keyof typeof AVATARS;

export function isAvatarId(v: unknown): v is AvatarId {
  return typeof v === "string" && Object.hasOwn(AVATARS, v);
}
