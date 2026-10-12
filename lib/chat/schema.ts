import type { ChatPropKind } from "@/lib/types";

/**
 * JSON schema ที่บังคับให้ Gemini ตอบแชท (responseJsonSchema) — ด่านที่ไม่มีการ์ดจะไม่มี field "prop" เลย
 * ผลยังต้องผ่าน sanitizeReply เสมอ (โมเดลอาจตอบผิด schema หรือแอบใส่ลิงก์/ตัวเลข)
 */
export function chatResponseSchema(kinds: readonly ChatPropKind[]) {
  const message: Record<string, unknown> = {
    type: "object",
    properties: {
      text: { type: "string", description: "ข้อความแชท 1–2 ประโยค" },
      ...(kinds.length
        ? {
            prop: {
              type: "object",
              description: "การ์ดประกอบ (ถ้ามี) — ไม่เกิน 1 ใบต่อรอบ",
              properties: {
                kind: { type: "string", enum: [...kinds] },
                title: { type: "string" },
                domain: { type: "string", description: "ต้องลงท้ายด้วย .example" },
                percent: { type: "number" },
                amount: { type: "number" },
                note: { type: "string" },
              },
              required: ["kind"],
            },
          }
        : {}),
    },
    required: ["text"],
  };
  return {
    type: "object",
    properties: { messages: { type: "array", items: message, minItems: 1, maxItems: 3 } },
    required: ["messages"],
  };
}

/** รูปที่โมเดลตอบ (ก่อนตรวจ — อาจผิดได้ทุก field) */
export interface RawChatReply {
  messages?: { text?: unknown; prop?: Record<string, unknown> | null }[];
}
