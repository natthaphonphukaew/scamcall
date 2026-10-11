import { connection } from "next/server";
import { computeLevelStats, type LevelStat } from "@/lib/game/boards";
import { listScenarios } from "@/lib/scenarios/load";
import { isDbConfigured } from "@/lib/server/db";
import { loadBoardData } from "@/lib/server/gameDb";

// GET /api/stats — สถิติรวมต่อด่าน (ไม่ระบุตัว) สำหรับ StoryCard บนแผนที่ เช่น "72% โดนหลอก"
// ไม่มี database = คืนลิสต์ว่าง (แผนที่ยังใช้ได้)

export async function GET() {
  await connection(); // อ่านตอน request เท่านั้น — อยู่นอก try ตามกติกา Cache Components
  let levels: LevelStat[] = [];
  if (isDbConfigured()) {
    try {
      const { playsByUser } = await loadBoardData();
      levels = computeLevelStats([...playsByUser.values()].flat(), listScenarios().map((s) => s.id));
    } catch (e) {
      console.error("[api/stats] failed:", e instanceof Error ? e.message : e);
    }
  }
  return Response.json({ levels }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
