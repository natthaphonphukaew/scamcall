import { describe, expect, it } from "vitest";
import fixture from "@/fixtures/calls/police-2026-10-10.json";
import { computeScore, gradeFor, HANG_UP_GRACE_SECONDS } from "./scoring";
import type { AnalysisResult, CallSession } from "./types";

const session = (patch: Partial<CallSession> = {}): CallSession => ({
  sessionId: "s",
  levelId: "police-money-laundering",
  startedAt: "",
  endedAt: "",
  endedBy: "player",
  hangupT: 20,
  turns: [],
  ...patch,
});

const analysis = (patch: Partial<AnalysisResult> = {}): AnalysisResult => ({
  turns: [],
  shouldHangUpAt: 16,
  leakedInfo: [],
  complied: false,
  saidCallback: false,
  summary: "",
  tips: [],
  ...patch,
});

describe("computeScore", () => {
  it("gives full marks for declining the call, whatever the analysis says", () => {
    expect(computeScore(session({ endedBy: "declined" }), analysis({ complied: true }))).toMatchObject({
      score: 100,
      grade: "strong",
    });
  });

  it("fails the level when the player agreed to the money request", () => {
    expect(computeScore(session({ hangupT: 1 }), analysis({ complied: true }))).toMatchObject({
      score: 0,
      grade: "scammed",
    });
  });

  it("gives 100 for hanging up within the grace window", () => {
    const r = computeScore(session({ hangupT: 16 + HANG_UP_GRACE_SECONDS }), analysis());
    expect(r.score).toBe(100);
  });

  it("loses 1 point per 2 seconds late, floored at 40", () => {
    const deadline = 16 + HANG_UP_GRACE_SECONDS;
    expect(computeScore(session({ hangupT: deadline + 20 }), analysis()).score).toBe(90);
    expect(computeScore(session({ hangupT: deadline + 21 }), analysis()).score).toBe(89);
    expect(computeScore(session({ hangupT: deadline + 500 }), analysis()).score).toBe(40);
  });

  it("treats a timeout as the minimum timing score", () => {
    expect(computeScore(session({ endedBy: "timeout", hangupT: 180 }), analysis()).score).toBe(40);
  });

  it("subtracts leaks, adds the callback bonus, and clamps to 0–100", () => {
    const r = computeScore(
      session(),
      analysis({ leakedInfo: ["ชื่อ-นามสกุล", "ธนาคารที่ใช้"], saidCallback: true }),
    );
    expect(r.score).toBe(90);
    expect(r.breakdown.map((b) => b.delta)).toEqual([100, -10, -10, 10]);

    const capped = computeScore(session(), analysis({ saidCallback: true }));
    expect(capped.score).toBe(100);

    const floor = computeScore(
      session({ endedBy: "timeout" }),
      analysis({ leakedInfo: ["ชื่อ-นามสกุล", "ธนาคารที่ใช้", "ยอดเงินในบัญชี", "เลขบัญชี", "เลขบัตร"] }),
    );
    expect(floor.score).toBe(0);
  });

  it("scores Nut's real test call as failed (asked for the account number to transfer)", () => {
    const real = fixture as CallSession;
    const r = computeScore(real, analysis({ complied: true, shouldHangUpAt: 27 }));
    expect(r).toMatchObject({ score: 0, grade: "scammed" });
  });
});

describe("gradeFor", () => {
  it.each([
    [100, "strong"],
    [90, "strong"],
    [89, "close"],
    [60, "close"],
    [59, "scammed"],
  ] as const)("%i → %s", (score, grade) => {
    expect(gradeFor(score)).toBe(grade);
  });
});
