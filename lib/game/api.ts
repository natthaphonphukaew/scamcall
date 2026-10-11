import type { LevelInfo, XpResult } from "./progression";
import type { BadgeId, PlayerProfile, TitleId } from "./types";

// รูปแบบ response ของ API ผู้เล่น — ใช้ร่วมกันทั้ง server และ browser

export interface PlayerStats {
  totalXp: number;
  level: LevelInfo;
  plays: number;
  /** ด่านที่ช่วย NPC สำเร็จแล้ว */
  savedLevelIds: string[];
  titles: TitleId[];
  badges: { id: BadgeId; earnedAt: string }[];
}

/** GET/PATCH /api/me */
export interface MeResponse {
  isAnonymous: boolean;
  /** null = ยังไม่ได้ตั้งฉายา/avatar (ให้ไปหน้า onboarding) */
  profile: PlayerProfile | null;
  stats: PlayerStats;
}

/** POST /api/plays */
export interface PlayResponse {
  xp: XpResult;
  before: LevelInfo;
  after: LevelInfo;
  newBadges: BadgeId[];
  saved: boolean;
}
