import type { NextRequest } from "next/server";
import { insertPlaytestRun } from "@/lib/server/db";
import { clientIp, errorResponse } from "@/lib/server/http";
import { normalizeTesterCode } from "@/lib/server/nickname";
import { createRateLimiter } from "@/lib/server/rateLimit";
import { readSignedSubmission } from "@/lib/server/submission";

// POST /api/playtest — body { testerCode, round, result: SignedResult } — ดู docs/SPEC.md ข้อ 3.3
// เก็บผลทดสอบกับเพื่อน (รหัสผู้ทดสอบ ไม่ใช่ชื่อจริง) ไว้เทียบรอบ 1 vs รอบ 2

const take = createRateLimiter(20, 60_000);

export async function POST(req: NextRequest) {
  if (!take(clientIp(req))) return errorResponse(429, "rate_limited");

  const checked = await readSignedSubmission(req);
  if (!checked.ok) return checked.response;

  const testerCode = normalizeTesterCode(checked.body.testerCode);
  const round = checked.body.round;
  if (!testerCode || typeof round !== "number" || !Number.isInteger(round) || round < 1 || round > 5) {
    return errorResponse(400, "bad_request");
  }

  try {
    const outcome = await insertPlaytestRun(testerCode, round, checked.result);
    if (outcome === "duplicate") return errorResponse(409, "already_submitted");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/playtest] failed:", e instanceof Error ? e.message : e);
    return errorResponse(502, "storage_failed");
  }
}
