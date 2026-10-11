import { isAvatarId, isValidAliasParts } from "@/lib/game/alias";
import type { BadgeId, PlayerProfile, PlayRecord } from "@/lib/game/types";
import { db, insert, type InsertOutcome } from "./db";

// อ่าน/เขียนตารางเกม (supabase/migrations/002_game.sql) ด้วย secret key — server เท่านั้น

interface PlayRow {
  session_id: string;
  user_id: string;
  level_id: string;
  channel: PlayRecord["channel"];
  ended_by: PlayRecord["endedBy"];
  score: number;
  grade: PlayRecord["grade"];
  complied: boolean;
  said_callback: boolean;
  leaked_count: number;
  hangup_t: number;
  should_hang_up_at: number;
  xp: number;
  saved: boolean;
  created_at: string;
}

const PLAY_COLUMNS =
  "session_id, user_id, level_id, channel, ended_by, score, grade, complied, said_callback, leaked_count, hangup_t, should_hang_up_at, xp, saved, created_at";

function toPlay(r: PlayRow): PlayRecord {
  return {
    sessionId: r.session_id,
    levelId: r.level_id,
    channel: r.channel,
    endedBy: r.ended_by,
    score: r.score,
    grade: r.grade,
    complied: r.complied,
    saidCallback: r.said_callback,
    leakedCount: r.leaked_count,
    hangupT: r.hangup_t,
    shouldHangUpAt: r.should_hang_up_at,
    xp: r.xp,
    saved: r.saved,
    createdAt: r.created_at,
  };
}

interface ProfileRow {
  id: string;
  alias_parts: number[];
  avatar: string;
  show_on_funny_board: boolean;
}

function toProfile(r: ProfileRow): PlayerProfile | null {
  // ข้อมูลเสีย (เช่น ลบชิ้นส่วนฉายาไปแล้ว) → ถือว่าไม่มีโปรไฟล์ ให้ผู้เล่นตั้งใหม่
  if (!isValidAliasParts(r.alias_parts) || !isAvatarId(r.avatar)) return null;
  return { aliasParts: r.alias_parts, avatar: r.avatar, showOnFunnyBoard: r.show_on_funny_board };
}

export async function getProfile(userId: string): Promise<PlayerProfile | null> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, alias_parts, avatar, show_on_funny_board")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();
  if (error) throw new Error(`profile read failed: ${error.message}`);
  return data ? toProfile(data) : null;
}

export async function saveProfile(userId: string, p: PlayerProfile): Promise<void> {
  const { error } = await db().from("profiles").upsert({
    id: userId,
    alias_parts: p.aliasParts,
    avatar: p.avatar,
    show_on_funny_board: p.showOnFunnyBoard,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`profile write failed: ${error.message}`);
}

export async function listPlays(userId: string): Promise<PlayRecord[]> {
  const { data, error } = await db()
    .from("plays")
    .select(PLAY_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1000)
    .returns<PlayRow[]>();
  if (error) throw new Error(`plays read failed: ${error.message}`);
  return (data ?? []).map(toPlay);
}

export function insertPlay(userId: string, p: PlayRecord): Promise<InsertOutcome> {
  return insert("plays", {
    session_id: p.sessionId,
    user_id: userId,
    level_id: p.levelId,
    channel: p.channel,
    ended_by: p.endedBy,
    score: p.score,
    grade: p.grade,
    complied: p.complied,
    said_callback: p.saidCallback,
    leaked_count: p.leakedCount,
    hangup_t: p.hangupT,
    should_hang_up_at: p.shouldHangUpAt,
    xp: p.xp,
    saved: p.saved,
  });
}

export async function listBadges(userId: string): Promise<{ id: BadgeId; earnedAt: string }[]> {
  const { data, error } = await db()
    .from("badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId)
    .returns<{ badge_id: BadgeId; earned_at: string }[]>();
  if (error) throw new Error(`badges read failed: ${error.message}`);
  return (data ?? []).map((b) => ({ id: b.badge_id, earnedAt: b.earned_at }));
}

export async function addBadges(userId: string, ids: BadgeId[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await db()
    .from("badges")
    .upsert(
      ids.map((badge_id) => ({ user_id: userId, badge_id })),
      { onConflict: "user_id,badge_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`badges write failed: ${error.message}`);
}

/** ข้อมูลทั้งหมดสำหรับคำนวณบอร์ด (ระดับห้องเรียน — พอสำหรับหลักพันสาย) */
export async function loadBoardData(): Promise<{
  playsByUser: Map<string, PlayRecord[]>;
  profiles: Map<string, PlayerProfile>;
}> {
  const [plays, profiles] = await Promise.all([
    db().from("plays").select(PLAY_COLUMNS).order("created_at", { ascending: true }).limit(5000).returns<PlayRow[]>(),
    db().from("profiles").select("id, alias_parts, avatar, show_on_funny_board").limit(5000).returns<ProfileRow[]>(),
  ]);
  if (plays.error) throw new Error(`plays read failed: ${plays.error.message}`);
  if (profiles.error) throw new Error(`profiles read failed: ${profiles.error.message}`);

  const playsByUser = new Map<string, PlayRecord[]>();
  for (const row of plays.data ?? []) {
    const list = playsByUser.get(row.user_id) ?? [];
    list.push(toPlay(row));
    playsByUser.set(row.user_id, list);
  }
  const profileMap = new Map<string, PlayerProfile>();
  for (const row of profiles.data ?? []) {
    const p = toProfile(row);
    if (p) profileMap.set(row.id, p);
  }
  return { playsByUser, profiles: profileMap };
}
