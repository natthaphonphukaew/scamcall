import type { NextRequest } from "next/server";
import { BadSessionError, parseCallSession } from "@/lib/analysis/validate";
import { getScenario } from "@/lib/scenarios/load";
import { computeScore } from "@/lib/scoring";
import { analyzeCall } from "@/lib/server/analyzeCall";
import { getAnalysisEnv, getSigningSecret } from "@/lib/server/env";
import { clientIp, errorResponse } from "@/lib/server/http";
import { createRateLimiter } from "@/lib/server/rateLimit";
import { signResult } from "@/lib/server/signedResult";
import type { AnalyzeResponse } from "@/lib/types";

// POST /api/analyze — body = CallSession (mask แล้ว) → AnalyzeResponse ดู docs/SPEC.md ข้อ 3.2
// ไม่เก็บ transcript ไว้ที่ server — ใช้แล้วทิ้ง

export const maxDuration = 60;

const takeAnalysis = createRateLimiter(10, 60_000);

export async function POST(req: NextRequest) {
  let session;
  try {
    session = parseCallSession(await req.json());
  } catch (e) {
    if (!(e instanceof BadSessionError) && !(e instanceof SyntaxError)) throw e;
    return errorResponse(400, "bad_request");
  }

  const scenario = getScenario(session.levelId);
  if (!scenario) return errorResponse(404, "level_not_found");

  if (!takeAnalysis(clientIp(req))) return errorResponse(429, "rate_limited");

  // ช่องทางมาจากไฟล์ด่านเสมอ (ไม่เชื่อ browser) — แชทคิดคะแนนเป็นจำนวนข้อความ
  session = { ...session, channel: scenario.channel ?? "call" };

  try {
    const analysis = await analyzeCall(session, scenario, getAnalysisEnv());

    // คะแนนคิดที่ server แล้วเซ็น — leaderboard/playtest เชื่อเฉพาะผลที่เซ็นแล้ว
    const secret = getSigningSecret();
    const score = computeScore(session, analysis);
    const result = secret
      ? signResult(
          {
            sessionId: session.sessionId,
            levelId: session.levelId,
            channel: scenario.channel ?? "call",
            endedBy: session.endedBy,
            hangupT: session.hangupT,
            shouldHangUpAt: analysis.shouldHangUpAt,
            score: score.score,
            grade: score.grade,
            complied: analysis.complied,
            saidCallback: analysis.saidCallback,
            leakedCount: analysis.leakedInfo.length,
            issuedAt: Date.now(),
          },
          secret,
        )
      : null;

    const body: AnalyzeResponse = {
      analysis,
      level: { id: scenario.id, title: scenario.title, callerId: scenario.callerId, correctExit: scenario.correctExit },
      result,
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/analyze] failed:", e instanceof Error ? e.message : e);
    return errorResponse(502, "analyze_failed");
  }
}
