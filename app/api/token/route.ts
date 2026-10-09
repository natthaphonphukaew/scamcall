import type { NextRequest } from "next/server";
import { getScenario } from "@/lib/scenarios/load";
import { getServerEnv } from "@/lib/server/env";
import { createLiveToken } from "@/lib/server/liveToken";
import { createRateLimiter } from "@/lib/server/rateLimit";

// POST /api/token — ดู docs/SPEC.md ข้อ 3.1
// ห้ามส่ง GEMINI_API_KEY หรือ system prompt กลับไปใน response

const takeToken = createRateLimiter(5, 60_000);

function error(status: number, code: string) {
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export async function POST(req: NextRequest) {
  let levelId: unknown;
  try {
    levelId = ((await req.json()) as { levelId?: unknown } | null)?.levelId;
  } catch {
    return error(400, "bad_request");
  }
  if (typeof levelId !== "string" || levelId.length === 0) return error(400, "bad_request");

  if (!takeToken(clientIp(req))) return error(429, "rate_limited");

  const scenario = getScenario(levelId);
  if (!scenario) return error(404, "level_not_found");

  try {
    const body = await createLiveToken(scenario, getServerEnv());
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    // รายละเอียดอยู่ใน log ฝั่ง server เท่านั้น
    console.error("[api/token] failed:", e instanceof Error ? e.message : e);
    return error(500, "token_failed");
  }
}
