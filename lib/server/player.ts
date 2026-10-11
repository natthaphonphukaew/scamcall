import type { PlayerStats } from "@/lib/game/api";
import { earnedTitles, levelForXp } from "@/lib/game/progression";
import type { PlayRecord } from "@/lib/game/types";
import { listBadges } from "./gameDb";

// รวมสถิติผู้เล่นจาก plays + badges

export async function buildStats(userId: string, plays: PlayRecord[]): Promise<PlayerStats> {
  const totalXp = plays.reduce((s, p) => s + p.xp, 0);
  return {
    totalXp,
    level: levelForXp(totalXp),
    plays: plays.length,
    savedLevelIds: [...new Set(plays.filter((p) => p.saved).map((p) => p.levelId))],
    titles: earnedTitles(plays),
    badges: await listBadges(userId),
  };
}
