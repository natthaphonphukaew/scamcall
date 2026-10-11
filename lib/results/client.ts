import type { SignedResult } from "@/lib/types";

// ส่งผลสาย (ที่ server เซ็นแล้ว) ขึ้น leaderboard / playtest จาก browser

export type SubmitOutcome = "sent" | "duplicate" | "bad_nickname" | "disabled" | "error";

async function post(url: string, body: unknown): Promise<SubmitOutcome> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return "sent";
    if (res.status === 409) return "duplicate";
    if (res.status === 503) return "disabled";
    if (res.status === 400) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      if (error === "bad_nickname") return "bad_nickname";
    }
    return "error";
  } catch {
    return "error";
  }
}

export function submitLeaderboard(nickname: string, result: SignedResult): Promise<SubmitOutcome> {
  return post("/api/leaderboard", { nickname, result });
}

export function submitPlaytest(testerCode: string, round: number, result: SignedResult): Promise<SubmitOutcome> {
  return post("/api/playtest", { testerCode, round, result });
}
