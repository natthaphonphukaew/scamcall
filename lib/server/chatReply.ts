import { GoogleGenAI } from "@google/genai";
import { chatResponseSchema, type RawChatReply } from "@/lib/chat/schema";
import { sanitizeReply } from "@/lib/chat/sanitize";
import { buildChatSystemPrompt, buildChatTurnPrompt } from "@/lib/scenarios/buildChatPrompt";
import type { ChatMessage, ChatResponse, Scenario } from "@/lib/types";
import type { ChatEnv } from "./env";

const TIMEOUT_MS = 20_000;

export class EmptyReplyError extends Error {}

/** ข้อความถัดไปของคนร้ายในแชท — Gemini text model + structured output แล้วกรองซ้ำ (docs/SPEC.md ข้อ 3.4) */
export async function chatReply(
  history: ChatMessage[],
  nudge: boolean,
  scenario: Scenario,
  env: ChatEnv,
): Promise<ChatResponse> {
  const kinds = scenario.chatProps ?? [];
  const ai = new GoogleGenAI({ apiKey: env.apiKey });
  const res = await ai.models.generateContent({
    model: env.chatModel,
    contents: buildChatTurnPrompt(history, nudge),
    config: {
      systemInstruction: buildChatSystemPrompt(scenario),
      responseMimeType: "application/json",
      responseJsonSchema: chatResponseSchema(kinds),
      temperature: 0.9,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    },
  });

  const text = res.text;
  if (!text) throw new EmptyReplyError("chat response is empty");
  const messages = sanitizeReply(JSON.parse(text) as RawChatReply, kinds);
  if (messages.length === 0) throw new EmptyReplyError("chat response has no usable messages");
  return { messages };
}
