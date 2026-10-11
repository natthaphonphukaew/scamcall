import type { Channel, EndedBy, ScoreResult } from "@/lib/types";

// ชนิดข้อมูลของระบบเกม (docs/GAME_SPEC.md)

/** หนึ่งสาย/แชทที่เล่นจบแล้ว ตามที่เก็บในตาราง plays */
export interface PlayRecord {
  sessionId: string;
  levelId: string;
  channel: Channel;
  endedBy: EndedBy;
  score: number;
  grade: ScoreResult["grade"];
  complied: boolean;
  saidCallback: boolean;
  leakedCount: number;
  hangupT: number;
  shouldHangUpAt: number;
  xp: number;
  /** ช่วย NPC สำเร็จ (GAME_SPEC ข้อ 3) */
  saved: boolean;
  /** ISO */
  createdAt: string;
}

export type BadgeId =
  | "first_call"
  | "quick_cut"
  | "tight_lips"
  | "golden_number"
  | "comeback"
  | "campus_guardian"
  | "chat_ninja";

export type TitleId = "iron_wall" | "quick_cutter" | "bounce_back" | "too_kind" | "good_listener" | "gullible";

/** ฉายา = index ของชิ้นส่วน [คำนำ, ตัวตน, ฉายาท้าย] ใน lib/game/alias.ts */
export type AliasParts = [number, number, number];

export interface PlayerProfile {
  aliasParts: AliasParts;
  avatar: string;
  showOnFunnyBoard: boolean;
}
