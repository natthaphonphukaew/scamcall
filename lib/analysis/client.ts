import type { AnalyzeResponse, CallSession } from "@/lib/types";

/** เรียก POST /api/analyze จาก browser */
export async function requestAnalysis(session: CallSession): Promise<AnalyzeResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
  if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
  return (await res.json()) as AnalyzeResponse;
}
