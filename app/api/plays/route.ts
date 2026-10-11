import type { NextRequest } from "next/server";
import { randomAliasParts } from "@/lib/game/alias";
import type { PlayResponse } from "@/lib/game/api";
import { earnedBadges, isSaved, levelForXp, xpForPlay } from "@/lib/game/progression";
import type { PlayRecord } from "@/lib/game/types";
import { listScenarios } from "@/lib/scenarios/load";
import { addBadges, getProfile, insertPlay, listBadges, listPlays, saveProfile } from "@/lib/server/gameDb";
import { clientIp, errorResponse } from "@/lib/server/http";
import { createRateLimiter } from "@/lib/server/rateLimit";
import { readSignedSubmission } from "@/lib/server/submission";
import { getCurrentUser } from "@/lib/supabase/server";

// POST /api/plays — body { result: SignedResult } → บันทึกผลของผู้เล่นปัจจุบัน + XP + เหรียญ
// เชื่อเฉพาะผลที่ server เซ็น (คะแนนแก้ใน browser ไม่ได้) · หนึ่งสายนับได้ครั้งเดียว · ดู docs/GAME_SPEC.md ข้อ 5, 7

const take = createRateLimiter(20, 60_000);

export async function POST(req: NextRequest) {
  if (!take(clientIp(req))) return errorResponse(429, "rate_limited");

  const user = await getCurrentUser();
  if (!user) return errorResponse(401, "no_session");

  const checked = await readSignedSubmission(req);
  if (!checked.ok) return checked.response;
  const r = checked.result;

  try {
    const history = await listPlays(user.id);
    if (history.some((p) => p.sessionId === r.sessionId)) return errorResponse(409, "already_submitted");

    const now = new Date();
    const xp = xpForPlay(r, history, now);
    const record: PlayRecord = {
      sessionId: r.sessionId,
      levelId: r.levelId,
      channel: r.channel,
      endedBy: r.endedBy,
      score: r.score,
      grade: r.grade,
      complied: r.complied,
      saidCallback: r.saidCallback,
      leakedCount: r.leakedCount,
      hangupT: r.hangupT,
      shouldHangUpAt: r.shouldHangUpAt,
      xp: xp.xp,
      saved: isSaved(r),
      createdAt: now.toISOString(),
    };
    if ((await insertPlay(user.id, record)) === "duplicate") return errorResponse(409, "already_submitted");

    // ผู้เล่นที่ยังไม่ได้ตั้งฉายา — สร้างให้ เพื่อให้ขึ้นบอร์ดได้ (แก้ทีหลังที่ /me)
    if (!(await getProfile(user.id))) {
      await saveProfile(user.id, { aliasParts: randomAliasParts(), avatar: "cat", showOnFunnyBoard: false });
    }

    const owned = new Set((await listBadges(user.id)).map((b) => b.id));
    const levelIds = listScenarios().map((s) => s.id);
    const newBadges = earnedBadges([...history, record], levelIds).filter((b) => !owned.has(b));
    await addBadges(user.id, newBadges);

    const before = history.reduce((s, p) => s + p.xp, 0);
    const body: PlayResponse = {
      xp,
      before: levelForXp(before),
      after: levelForXp(before + xp.xp),
      newBadges,
      saved: record.saved,
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/plays] failed:", e instanceof Error ? e.message : e);
    return errorResponse(502, "storage_failed");
  }
}
