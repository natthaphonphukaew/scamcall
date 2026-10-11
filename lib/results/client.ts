import type { PlayResponse } from "@/lib/game/api";
import type { SignedResult } from "@/lib/types";

// ส่งผลสาย (ที่ server เซ็นแล้ว) เข้าระบบผู้เล่น / playtest จาก browser

export type SubmitOutcome = "sent" | "duplicate" | "disabled" | "error";

function outcomeOf(res: Response): SubmitOutcome {
  if (res.ok) return "sent";
  if (res.status === 409) return "duplicate";
  if (res.status === 503) return "disabled";
  return "error";
}

async function post(url: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

/** บันทึกผลของผู้เล่นปัจจุบัน → XP / เลเวล / เหรียญ */
export async function submitPlay(result: SignedResult): Promise<{ outcome: SubmitOutcome; play: PlayResponse | null }> {
  const res = await post("/api/plays", { result });
  if (!res) return { outcome: "error", play: null };
  const outcome = outcomeOf(res);
  return { outcome, play: outcome === "sent" ? ((await res.json()) as PlayResponse) : null };
}

export async function submitPlaytest(testerCode: string, round: number, result: SignedResult): Promise<SubmitOutcome> {
  const res = await post("/api/playtest", { testerCode, round, result });
  return res ? outcomeOf(res) : "error";
}
