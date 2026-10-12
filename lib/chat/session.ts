import type { CallSession, ChatProp, EndedBy, RedactionType, Speaker, TranscriptTurn } from "@/lib/types";
import { describeProp } from "./props";

// แปลงแชทเป็น CallSession รูปเดียวกับสายโทร → ใช้ /api/analyze, หน้า X-Ray, คะแนน และ XP ชุดเดิมได้ทั้งหมด

export interface ChatUiMessage {
  id: string;
  speaker: Speaker;
  text: string;
  prop?: ChatProp;
  /** วินาทีตั้งแต่เริ่มแชท */
  t: number;
  redactions: RedactionType[];
  /** ข้อความผู้เล่นที่คนร้าย "อ่านแล้ว" */
  read?: boolean;
}

/** ข้อความหนึ่งรายการใน transcript: ข้อความ + คำอธิบายการ์ด (ให้ X-Ray เห็นว่าคนร้ายส่งอะไรมา) */
export function turnText(m: Pick<ChatUiMessage, "text" | "prop">): string {
  return [m.text, m.prop ? describeProp(m.prop) : ""].filter(Boolean).join(" ");
}

export function chatToSession(args: {
  sessionId: string;
  levelId: string;
  startedAt: string;
  endedAt: string;
  endedBy: EndedBy;
  hangupT: number;
  messages: ChatUiMessage[];
}): CallSession {
  const turns: TranscriptTurn[] = args.messages.map((m) => ({
    id: m.id,
    t: m.t,
    speaker: m.speaker,
    text: turnText(m),
    redactions: m.redactions,
  }));
  return {
    sessionId: args.sessionId,
    levelId: args.levelId,
    channel: "chat",
    startedAt: args.startedAt,
    endedAt: args.endedAt,
    endedBy: args.endedBy,
    hangupT: args.hangupT,
    turns,
  };
}

/** เวลาที่ "กำลังพิมพ์…" ก่อนข้อความคนร้ายขึ้น — ยาวตามความยาวข้อความ ให้รู้สึกเหมือนคนพิมพ์จริง */
export function typingDelayMs(text: string, hasProp = false): number {
  const base = 500 + text.length * 35 + (hasProp ? 600 : 0);
  return Math.min(2800, Math.max(800, base));
}
