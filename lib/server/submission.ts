import { getScenario } from "@/lib/scenarios/load";
import type { ResultPayload } from "@/lib/types";
import { isDbConfigured } from "./db";
import { getSigningSecret } from "./env";
import { errorResponse } from "./http";
import { verifyResult } from "./signedResult";

// ขั้นตอนร่วมของ POST /api/plays และ /api/playtest: เปิดใช้งานอยู่ไหม → อ่าน body → ตรวจลายเซ็น

export type Checked = { ok: true; body: Record<string, unknown>; result: ResultPayload } | { ok: false; response: Response };

export async function readSignedSubmission(req: Request): Promise<Checked> {
  const secret = getSigningSecret();
  if (!secret || !isDbConfigured()) return { ok: false, response: errorResponse(503, "storage_disabled") };

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (typeof parsed !== "object" || parsed === null) throw new SyntaxError("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return { ok: false, response: errorResponse(400, "bad_request") };
  }

  const result = verifyResult(body.result, secret);
  if (!result || !getScenario(result.levelId)) return { ok: false, response: errorResponse(403, "invalid_result") };
  return { ok: true, body, result };
}
