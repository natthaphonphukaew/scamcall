import { createHmac, timingSafeEqual } from "node:crypto";
import type { ResultPayload, SignedResult } from "@/lib/types";

// เซ็นผลสายด้วย HMAC-SHA256 — คะแนนคิดที่ server ตอน /api/analyze แล้วเซ็นกลับไป
// ตอนส่ง leaderboard/playtest server ตรวจลายเซ็นก่อนบันทึก (กันผู้เล่นแก้คะแนนใน browser)

/** ลำดับ field ตายตัว — ใช้สร้างข้อความที่เซ็น ไม่ขึ้นกับลำดับ key ของ JSON ที่ client ส่งมา */
const FIELDS = [
  "sessionId",
  "levelId",
  "channel",
  "endedBy",
  "hangupT",
  "shouldHangUpAt",
  "score",
  "grade",
  "complied",
  "saidCallback",
  "leakedCount",
  "issuedAt",
] as const satisfies readonly (keyof ResultPayload)[];

export const RESULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function canonical(payload: ResultPayload): string {
  return JSON.stringify(FIELDS.map((f) => payload[f]));
}

function hmac(payload: ResultPayload, secret: string): string {
  return createHmac("sha256", secret).update(canonical(payload)).digest("base64url");
}

export function signResult(payload: ResultPayload, secret: string): SignedResult {
  return { payload, sig: hmac(payload, secret) };
}

/** คืน payload ถ้าลายเซ็นถูกและยังไม่หมดอายุ ไม่งั้น null */
export function verifyResult(raw: unknown, secret: string, now = Date.now()): ResultPayload | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { payload, sig } = raw as Partial<SignedResult>;
  if (typeof sig !== "string" || typeof payload !== "object" || payload === null) return null;

  // รับเฉพาะ field ที่รู้จัก (กัน client แนบ field แปลกๆ ไปกับ insert)
  const given = payload as unknown as Record<string, unknown>;
  const clean = Object.fromEntries(FIELDS.map((f) => [f, given[f]])) as unknown as ResultPayload;

  const expected = Buffer.from(hmac(clean, secret));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  if (typeof clean.issuedAt !== "number" || now - clean.issuedAt > RESULT_MAX_AGE_MS || clean.issuedAt > now + 60_000) {
    return null;
  }
  return clean;
}
