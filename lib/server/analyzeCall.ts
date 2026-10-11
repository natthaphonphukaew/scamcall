import { GoogleGenAI } from "@google/genai";
import { ANALYSIS_SYSTEM_INSTRUCTION, buildAnalysisPrompt } from "@/lib/analysis/buildAnalysisPrompt";
import { emptyAnalysis, normalizeAnalysis } from "@/lib/analysis/normalize";
import { ANALYSIS_SCHEMA, type RawAnalysis } from "@/lib/analysis/schema";
import type { AnalysisResult, CallSession, Scenario } from "@/lib/types";
import type { AnalysisEnv } from "./env";

const TIMEOUT_MS = 30_000;

/** วิเคราะห์สายด้วย Gemini text model + structured output — ดู docs/SPEC.md ข้อ 3.2 */
export async function analyzeCall(session: CallSession, scenario: Scenario, env: AnalysisEnv): Promise<AnalysisResult> {
  if (!session.turns.some((t) => t.speaker === "scammer")) return emptyAnalysis(session);

  const ai = new GoogleGenAI({ apiKey: env.apiKey });
  const res = await ai.models.generateContent({
    model: env.analysisModel,
    contents: buildAnalysisPrompt(session, scenario),
    config: {
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: ANALYSIS_SCHEMA,
      temperature: 0.2,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    },
  });

  const text = res.text;
  if (!text) throw new Error("analysis response is empty");
  return normalizeAnalysis(JSON.parse(text) as RawAnalysis, session);
}
