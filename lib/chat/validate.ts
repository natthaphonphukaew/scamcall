import type { ChatMessage, ChatRequest } from "@/lib/types";
import { MAX_CHAT_CHARS, MAX_CHAT_MESSAGES } from "./constants";

// ตรวจ body ของ POST /api/chat — มาจาก browser จึงไม่เชื่อ type (กรองเนื้อหาต่อด้วย sanitizeHistoryMessage)

export class BadChatError extends Error {}

export function parseChatRequest(raw: unknown): ChatRequest {
  if (typeof raw !== "object" || raw === null) throw new BadChatError("body must be an object");
  const r = raw as Record<string, unknown>;
  if (typeof r.levelId !== "string" || r.levelId.length === 0 || r.levelId.length > 100) {
    throw new BadChatError("levelId invalid");
  }
  if (!Array.isArray(r.history) || r.history.length === 0) throw new BadChatError("history invalid");
  if (r.history.length >= MAX_CHAT_MESSAGES) throw new BadChatError("chat limit reached");

  const history: ChatMessage[] = r.history.map((rawMsg, i) => {
    const m = rawMsg as Record<string, unknown>;
    if (m?.speaker !== "scammer" && m?.speaker !== "player") throw new BadChatError(`message ${i} speaker invalid`);
    if (typeof m.text !== "string" || m.text.length > MAX_CHAT_CHARS)
      throw new BadChatError(`message ${i} text invalid`);
    return { speaker: m.speaker, text: m.text, prop: m.prop as ChatMessage["prop"] };
  });

  return { levelId: r.levelId, history, nudge: r.nudge === true };
}
