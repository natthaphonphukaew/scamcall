import type { NextRequest } from "next/server";
import { MAX_CHAT_CHARS } from "@/lib/chat/constants";
import { sanitizeHistoryMessage } from "@/lib/chat/sanitize";
import { BadChatError, parseChatRequest } from "@/lib/chat/validate";
import { getScenario } from "@/lib/scenarios/load";
import { chatReply } from "@/lib/server/chatReply";
import { getChatEnv } from "@/lib/server/env";
import { clientIp, errorResponse } from "@/lib/server/http";
import { createRateLimiter } from "@/lib/server/rateLimit";

// POST /api/chat — body = ChatRequest (ประวัติแชททั้งหมด) → ChatResponse ดู docs/SPEC.md ข้อ 3.4
// stateless: ไม่เก็บแชทไว้ที่ server — ใช้แล้วทิ้ง

export const maxDuration = 30;

// แชทหนึ่งรอบมีไม่เกิน ~20 ครั้ง (40 ข้อความสองฝั่ง) — เผื่อเล่นต่อกันได้ แต่กันยิงรัวๆ
const takeChat = createRateLimiter(20, 60_000);

export async function POST(req: NextRequest) {
  let body;
  try {
    body = parseChatRequest(await req.json());
  } catch (e) {
    if (!(e instanceof BadChatError) && !(e instanceof SyntaxError)) throw e;
    return errorResponse(400, "bad_request");
  }

  const scenario = getScenario(body.levelId);
  if (!scenario || scenario.channel !== "chat") return errorResponse(404, "level_not_found");

  if (!takeChat(clientIp(req))) return errorResponse(429, "rate_limited");

  const history = body.history.map((m) => sanitizeHistoryMessage(m, scenario.chatProps ?? [], MAX_CHAT_CHARS));

  try {
    const reply = await chatReply(history, body.nudge === true, scenario, getChatEnv());
    return Response.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/chat] failed:", e instanceof Error ? e.message : e);
    return errorResponse(502, "chat_failed");
  }
}
