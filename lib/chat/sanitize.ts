import { maskSensitive } from "@/lib/privacy/mask";
import type { ChatMessage, ChatProp, ChatPropKind } from "@/lib/types";
import { MAX_SCAMMER_CHARS } from "./constants";
import type { RawChatReply } from "./schema";

// กรองข้อความของคนร้ายก่อนถึงผู้เล่น (CLAUDE.md ข้อ 7) — ไม่เชื่อโมเดล 100%
// - ลิงก์/ชื่อเว็บในข้อความ → "[ลิงก์]" (ลิงก์ส่งได้ทางการ์ดเท่านั้น และต้องเป็นโดเมน .example)
// - ตัวเลขที่ดูเหมือนเลขบัญชี/บัตร/เบอร์ → mask ด้วยกฎเดียวกับ transcript

export const LINK_PLACEHOLDER = "[ลิงก์]";
const MAX_PROP_TEXT = 60;
const MAX_MESSAGES = 3;

// http(s)://… · www.… · ชื่อโดเมนทั่วไป (ตัวอักษรละติน + จุด + TLD 2 ตัวขึ้นไป) เช่น vip-invest.com, abc.co.th
const URL_LIKE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?/gi;

export function stripLinks(text: string): string {
  return text.replace(URL_LIKE, LINK_PLACEHOLDER);
}

function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const oneLine = v.replace(/\s+/g, " ").trim().slice(0, max);
  return maskSensitive(stripLinks(oneLine)).text;
}

/** โดเมนของการ์ดลิงก์: บังคับให้เป็น *.example (RFC 2606 — ไม่มีเว็บจริง) */
export function toExampleDomain(v: unknown): string {
  const raw = typeof v === "string" ? v.toLowerCase().trim() : "";
  if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.example$/.test(raw) && raw.length <= 40) return raw;
  const label = raw
    .replace(/^https?:\/\//, "")
    .split(/[./]/)[0]
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24);
  return `${label || "member-portal"}.example`;
}

function clampNumber(v: unknown, min: number, max: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.round(Math.min(max, Math.max(min, v)));
}

export function sanitizeProp(raw: unknown, allowed: readonly ChatPropKind[]): ChatProp | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  if (!allowed.includes(r.kind as ChatPropKind)) return undefined;

  switch (r.kind as ChatPropKind) {
    case "link": {
      const title = cleanText(r.title, MAX_PROP_TEXT) || "สมัครสมาชิก";
      return { kind: "link", title, domain: toExampleDomain(r.domain) };
    }
    case "profit": {
      const percent = clampNumber(r.percent, 1, 999);
      if (percent === null) return undefined;
      return { kind: "profit", title: cleanText(r.title, MAX_PROP_TEXT) || "กำไรของสมาชิก", percent };
    }
    case "slip": {
      const amount = clampNumber(r.amount, 1, 1_000_000);
      if (amount === null) return undefined;
      return { kind: "slip", amount, note: cleanText(r.note, MAX_PROP_TEXT) || "โอนสำเร็จ" };
    }
  }
}

/** คำตอบของโมเดล → ข้อความที่ปลอดภัย (1–3 ข้อความ, การ์ดไม่เกิน 1 ใบต่อรอบ) */
export function sanitizeReply(
  raw: RawChatReply,
  allowed: readonly ChatPropKind[],
): { text: string; prop?: ChatProp }[] {
  const out: { text: string; prop?: ChatProp }[] = [];
  let usedProp = false;
  for (const m of Array.isArray(raw.messages) ? raw.messages.slice(0, MAX_MESSAGES) : []) {
    const text = cleanText(m?.text, MAX_SCAMMER_CHARS);
    const prop = usedProp ? undefined : sanitizeProp(m?.prop, allowed);
    if (!text && !prop) continue;
    if (prop) usedProp = true;
    out.push(prop ? { text, prop } : { text });
  }
  return out;
}

/** ประวัติแชทจาก browser → เชื่อไม่ได้ จึงกรองซ้ำทั้งสองฝั่ง (mask ข้อความผู้เล่น, การ์ดตามกฎด่าน) */
export function sanitizeHistoryMessage(
  m: ChatMessage,
  allowed: readonly ChatPropKind[],
  maxPlayerChars: number,
): ChatMessage {
  if (m.speaker === "player") return { speaker: "player", text: cleanText(m.text, maxPlayerChars) };
  const prop = sanitizeProp(m.prop, allowed);
  const text = cleanText(m.text, MAX_SCAMMER_CHARS);
  return prop ? { speaker: "scammer", text, prop } : { speaker: "scammer", text };
}
