import type { NextRequest } from "next/server";
import { insertLeaderboard } from "@/lib/server/db";
import { clientIp, errorResponse } from "@/lib/server/http";
import { normalizeNickname } from "@/lib/server/nickname";
import { createRateLimiter } from "@/lib/server/rateLimit";
import { readSignedSubmission } from "@/lib/server/submission";

// POST /api/leaderboard — body { nickname, result: SignedResult } — ดู docs/SPEC.md ข้อ 3.3
// บันทึกแค่ชื่อเล่น + คะแนน + เวลาวางสาย (ไม่มี transcript) หนึ่งสายส่งได้ครั้งเดียว

const take = createRateLimiter(10, 60_000);

export async function POST(req: NextRequest) {
  if (!take(clientIp(req))) return errorResponse(429, "rate_limited");

  const checked = await readSignedSubmission(req);
  if (!checked.ok) return checked.response;

  const nickname = normalizeNickname(checked.body.nickname);
  if (!nickname) return errorResponse(400, "bad_nickname");

  try {
    const outcome = await insertLeaderboard(nickname, checked.result);
    if (outcome === "duplicate") return errorResponse(409, "already_submitted");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/leaderboard] failed:", e instanceof Error ? e.message : e);
    return errorResponse(502, "storage_failed");
  }
}
