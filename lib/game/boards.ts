import { formatAlias } from "./alias";
import { earnedTitles, lateSecondsOf, levelForXp } from "./progression";
import type { PlayerProfile, PlayRecord, TitleId } from "./types";

// คำนวณบอร์ด /hall จาก plays + profiles — pure function (docs/GAME_SPEC.md ข้อ 8)
// ผลลัพธ์ไม่มี user id / อีเมล — มีแค่ฉายา avatar เลเวล title

export interface BoardEntry {
  alias: string;
  avatar: string;
  level: number;
  titles: TitleId[];
  /** ค่าที่ใช้จัดอันดับ (คะแนนเฉลี่ย / คะแนนที่เพิ่ม / จำนวนครั้งที่ยอมโอน) */
  value: number;
}

export interface LevelStat {
  levelId: string;
  plays: number;
  /** 0–100 */
  scammedPercent: number;
  /** null = ไม่มีสายโทรให้คิด (ยังไม่มีคนเล่น หรือเป็นด่านแชท) */
  avgLateSeconds: number | null;
}

export interface Boards {
  resilient: BoardEntry[];
  improved: BoardEntry[];
  funny: BoardEntry[];
  levels: LevelStat[];
}

export const BOARD_SIZE = 10;
export const MIN_PLAYS_RESILIENT = 3;
export const MIN_PLAYS_IMPROVED = 2;

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeBoards(
  playsByUser: Map<string, PlayRecord[]>,
  profiles: Map<string, PlayerProfile>,
  levelIds: readonly string[],
): Boards {
  const entries: (BoardEntry & { userId: string; plays: PlayRecord[]; showOnFunnyBoard: boolean })[] = [];
  for (const [userId, plays] of playsByUser) {
    const profile = profiles.get(userId);
    if (!profile || plays.length === 0) continue; // ไม่มีโปรไฟล์ = ไม่มีฉายาให้แสดง
    const totalXp = plays.reduce((s, p) => s + p.xp, 0);
    entries.push({
      userId,
      plays,
      showOnFunnyBoard: profile.showOnFunnyBoard,
      alias: formatAlias(profile.aliasParts),
      avatar: profile.avatar,
      level: levelForXp(totalXp).level,
      titles: earnedTitles(plays),
      value: 0,
    });
  }

  const publicEntry = ({ alias, avatar, level, titles }: (typeof entries)[number], value: number): BoardEntry => ({
    alias,
    avatar,
    level,
    titles,
    value,
  });
  const top = (list: BoardEntry[]) => list.sort((a, b) => b.value - a.value).slice(0, BOARD_SIZE);

  const resilient = top(
    entries
      .map((e) => ({ e, faced: e.plays.filter((p) => p.endedBy !== "declined") }))
      .filter(({ faced }) => faced.length >= MIN_PLAYS_RESILIENT)
      .map(({ e, faced }) => publicEntry(e, round1(faced.reduce((s, p) => s + p.score, 0) / faced.length))),
  );

  const improved = top(
    entries
      .filter((e) => e.plays.length >= MIN_PLAYS_IMPROVED)
      .map((e) => {
        const ordered = [...e.plays].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const best = Math.max(...ordered.map((p) => p.score));
        return publicEntry(e, best - ordered[0].score);
      })
      .filter((e) => e.value > 0),
  );

  // บอร์ดขำ: เฉพาะคนที่เปิดสวิตช์เอง
  const funny = top(
    entries
      .filter((e) => e.showOnFunnyBoard)
      .map((e) => publicEntry(e, e.plays.filter((p) => p.complied).length))
      .filter((e) => e.value > 0),
  );

  const levels = computeLevelStats([...playsByUser.values()].flat(), levelIds);
  return { resilient, improved, funny, levels };
}

/** สถิติรวมของทุกคนต่อด่าน (ไม่ระบุตัว) — ใช้ใน /hall และ StoryCard บนแผนที่ */
export function computeLevelStats(allPlays: PlayRecord[], levelIds: readonly string[]): LevelStat[] {
  return levelIds.map((levelId) => {
    const ps = allPlays.filter((p) => p.levelId === levelId);
    const facedCalls = ps.filter((p) => p.endedBy !== "declined" && p.channel !== "chat");
    return {
      levelId,
      plays: ps.length,
      scammedPercent: ps.length ? Math.round((ps.filter((p) => p.complied || p.grade === "scammed").length / ps.length) * 100) : 0,
      avgLateSeconds: facedCalls.length
        ? round1(facedCalls.reduce((s, p) => s + lateSecondsOf(p), 0) / facedCalls.length)
        : null,
    };
  });
}
