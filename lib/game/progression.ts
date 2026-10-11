import { HANG_UP_GRACE_SECONDS } from "@/lib/scoring";
import type { ResultPayload } from "@/lib/types";
import type { BadgeId, PlayRecord, TitleId } from "./types";

// XP / เลเวล / เหรียญ / ฉายาพฤติกรรม — pure function (docs/GAME_SPEC.md ข้อ 3, 5, 6, 7)
// คิดจากผลที่ server เซ็นแล้วเท่านั้น และให้รางวัล "พฤติกรรมที่ถูก" ไม่ใช่การคุยนาน

type Outcome = Pick<
  ResultPayload,
  "levelId" | "channel" | "endedBy" | "score" | "grade" | "complied" | "saidCallback" | "leakedCount" | "hangupT" | "shouldHangUpAt"
>;

// ---- พฤติกรรมพื้นฐาน ----

/** ช่วย NPC สำเร็จ: รอดจริง และต้องเผชิญหน้า (ไม่รับสายไม่นับ — ปลอดภัยแต่ยังไม่ได้ฝึก) */
export function isSaved(o: Outcome): boolean {
  return (o.grade === "strong" || o.grade === "close") && !o.complied && o.endedBy !== "declined";
}

/** วางสายเองภายในเวลาผ่อนผันหลังจุดอันตราย */
export function isOnTime(o: Outcome): boolean {
  return o.endedBy === "player" && !o.complied && o.hangupT <= o.shouldHangUpAt + HANG_UP_GRACE_SECONDS;
}

export function lateSecondsOf(o: Pick<Outcome, "endedBy" | "hangupT" | "shouldHangUpAt">): number {
  return o.endedBy === "declined" ? 0 : Math.max(0, o.hangupT - o.shouldHangUpAt);
}

// ---- XP ----

export const XP_BY_GRADE = { strong: 100, close: 60, scammed: 20 } as const;
export const XP_ON_TIME = 30;
export const XP_NO_LEAK = 20;
export const XP_CALLBACK = 20;
export const XP_DECLINED = 30;

/** วันตามเวลาไทย (UTC+7) — ใช้นับการเล่นด่านเดิมซ้ำในวันเดียว */
export function thaiDayKey(date: Date): string {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface XpResult {
  xp: number;
  breakdown: { label: string; xp: number }[];
  /** ตัวคูณกันฟาร์ม (1, 0.5, 0) */
  multiplier: number;
}

export function xpForPlay(o: Outcome, history: PlayRecord[], now: Date): XpResult {
  const breakdown: XpResult["breakdown"] = [];
  if (o.endedBy === "declined") {
    breakdown.push({ label: "ไม่รับสาย (ปลอดภัย แต่ยังไม่ได้ฝึก)", xp: XP_DECLINED });
  } else {
    breakdown.push({ label: `ผลลัพธ์ ${o.grade}`, xp: XP_BY_GRADE[o.grade] });
    if (isOnTime(o)) breakdown.push({ label: "วางสายทันเวลา", xp: XP_ON_TIME });
    if (o.leakedCount === 0 && !o.complied) breakdown.push({ label: "ไม่หลุดข้อมูลเลย", xp: XP_NO_LEAK });
    if (o.saidCallback) breakdown.push({ label: "จะโทรกลับเบอร์ทางการ / 1441", xp: XP_CALLBACK });
  }

  // กันฟาร์ม: ด่านเดิมวันเดียวกัน ครั้งที่ 1 = 100%, 2–3 = 50%, 4+ = 0 · ด่านที่เคยช่วยแล้ว ≤ 50%
  const today = thaiDayKey(now);
  const sameLevel = history.filter((p) => p.levelId === o.levelId);
  const playedToday = sameLevel.filter((p) => thaiDayKey(new Date(p.createdAt)) === today).length;
  let multiplier = playedToday === 0 ? 1 : playedToday <= 2 ? 0.5 : 0;
  if (sameLevel.some((p) => p.saved)) multiplier = Math.min(multiplier, 0.5);

  const raw = breakdown.reduce((sum, b) => sum + b.xp, 0);
  if (multiplier < 1) breakdown.push({ label: multiplier === 0 ? "เล่นด่านนี้ครบโควตาวันนี้แล้ว" : "เล่นซ้ำ (XP ครึ่งเดียว)", xp: 0 });
  return { xp: Math.round(raw * multiplier), breakdown, multiplier };
}

// ---- เลเวล ----

/** XP สะสมที่ต้องมีเพื่อถึงเลเวล L: 100 × (L−1)L/2 → เลเวล 2 = 100, 3 = 300, 4 = 600 */
export function xpToReach(level: number): number {
  return (100 * (level - 1) * level) / 2;
}

export const LEVEL_TITLES: [number, string][] = [
  [12, "ตำนานสายตัดไว"],
  [8, "ผู้พิทักษ์แคมปัส"],
  [5, "นักสืบบางมด"],
  [3, "ผู้เริ่มรู้ทัน"],
  [1, "นักศึกษาใหม่"],
];

export interface LevelInfo {
  level: number;
  title: string;
  /** XP ที่สะสมในเลเวลนี้แล้ว / ที่ต้องใช้ทั้งเลเวล */
  xpIntoLevel: number;
  xpForLevel: number;
}

export function levelForXp(totalXp: number): LevelInfo {
  let level = 1;
  while (totalXp >= xpToReach(level + 1)) level++;
  const title = LEVEL_TITLES.find(([min]) => level >= min)?.[1] ?? "นักศึกษาใหม่";
  return {
    level,
    title,
    xpIntoLevel: totalXp - xpToReach(level),
    xpForLevel: xpToReach(level + 1) - xpToReach(level),
  };
}

// ---- เหรียญ / ฉายาพฤติกรรม ----

function hasComeback(plays: PlayRecord[]): boolean {
  const ordered = [...plays].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const failedLevels = new Set<string>();
  for (const p of ordered) {
    if (p.grade === "strong" && failedLevels.has(p.levelId)) return true;
    if (p.complied || p.grade === "scammed") failedLevels.add(p.levelId);
  }
  return false;
}

/** เหรียญที่ "ควรมี" ตามประวัติทั้งหมด — server เพิ่มเฉพาะตัวที่ยังไม่มี */
export function earnedBadges(plays: PlayRecord[], allLevelIds: readonly string[]): BadgeId[] {
  const faced = plays.filter((p) => p.endedBy !== "declined");
  const savedLevels = new Set(plays.filter((p) => p.saved).map((p) => p.levelId));
  const strongChatLevels = new Set(plays.filter((p) => p.channel === "chat" && p.grade === "strong").map((p) => p.levelId));

  const badges: BadgeId[] = [];
  if (plays.length >= 1) badges.push("first_call");
  if (plays.some(isOnTime)) badges.push("quick_cut");
  if (faced.filter((p) => p.leakedCount === 0 && !p.complied).length >= 5) badges.push("tight_lips");
  if (plays.filter((p) => p.saidCallback).length >= 3) badges.push("golden_number");
  if (hasComeback(plays)) badges.push("comeback");
  if (allLevelIds.length > 0 && allLevelIds.every((id) => savedLevels.has(id))) badges.push("campus_guardian");
  if (strongChatLevels.size >= 2) badges.push("chat_ninja");
  return badges;
}

export function earnedTitles(plays: PlayRecord[]): TitleId[] {
  const faced = plays.filter((p) => p.endedBy !== "declined");
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const compliedLevels = new Set(plays.filter((p) => p.complied).map((p) => p.levelId));

  const titles: TitleId[] = [];
  if (faced.length >= 3 && mean(faced.map((p) => p.score)) >= 90) titles.push("iron_wall");
  if (plays.filter(isOnTime).length >= 5) titles.push("quick_cutter");
  if (hasComeback(plays)) titles.push("bounce_back");
  if (plays.filter((p) => p.complied).length >= 3) titles.push("too_kind");
  if (faced.length >= 3 && mean(faced.map(lateSecondsOf)) > 60) titles.push("good_listener");
  if (compliedLevels.size >= 2) titles.push("gullible");
  return titles;
}
