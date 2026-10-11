import { describe, expect, it } from "vitest";
import { lateSeconds, playtestCsv, summarizePlaytest } from "@/lib/playtest/summary";
import type { ResultPayload } from "@/lib/types";
import type { PlaytestRun } from "./db";
import { normalizeNickname, normalizeTesterCode } from "./nickname";
import { RESULT_MAX_AGE_MS, signResult, verifyResult } from "./signedResult";

const SECRET = "x".repeat(32);
const NOW = 1_800_000_000_000;

const payload: ResultPayload = {
  sessionId: "s1",
  levelId: "police-money-laundering",
  endedBy: "player",
  hangupT: 20,
  shouldHangUpAt: 16,
  score: 100,
  grade: "strong",
  complied: false,
  leakedCount: 0,
  issuedAt: NOW,
};

describe("signed results", () => {
  it("round-trips a signed result", () => {
    expect(verifyResult(signResult(payload, SECRET), SECRET, NOW)).toEqual(payload);
  });

  it("rejects an edited score, a wrong secret and garbage", () => {
    const signed = signResult(payload, SECRET);
    expect(verifyResult({ ...signed, payload: { ...payload, score: 0 } }, SECRET, NOW)).toBeNull();
    expect(verifyResult({ ...signed, payload: { ...payload, score: 100, hangupT: 1 } }, SECRET, NOW)).toBeNull();
    expect(verifyResult(signed, "y".repeat(32), NOW)).toBeNull();
    expect(verifyResult({ payload, sig: "nope" }, SECRET, NOW)).toBeNull();
    expect(verifyResult(null, SECRET, NOW)).toBeNull();
  });

  it("does not care about key order, and drops unknown fields", () => {
    const { sig } = signResult(payload, SECRET);
    const reordered = Object.fromEntries(Object.entries(payload).reverse());
    const verified = verifyResult({ payload: { ...reordered, isAdmin: true }, sig }, SECRET, NOW);
    expect(verified).toEqual(payload);
    expect(verified).not.toHaveProperty("isAdmin");
  });

  it("expires after 24 hours", () => {
    const signed = signResult(payload, SECRET);
    expect(verifyResult(signed, SECRET, NOW + RESULT_MAX_AGE_MS - 1)).not.toBeNull();
    expect(verifyResult(signed, SECRET, NOW + RESULT_MAX_AGE_MS + 1)).toBeNull();
  });
});

describe("normalizeNickname", () => {
  it.each([
    ["  นัท   KMUTT ", "นัท KMUTT"],
    ["Nut", "Nut"],
    ["ab​c", "abc"],
  ])("cleans %j", (raw, clean) => {
    expect(normalizeNickname(raw)).toBe(clean);
  });

  it.each([["a"], ["x".repeat(21)], ["F u c k"], ["0812345678"], ["นัท 123456"], [42], [""]])(
    "rejects %j",
    (raw) => {
      expect(normalizeNickname(raw)).toBeNull();
    },
  );
});

describe("normalizeTesterCode", () => {
  it("uppercases valid codes and rejects others", () => {
    expect(normalizeTesterCode(" p01 ")).toBe("P01");
    expect(normalizeTesterCode("นัท")).toBeNull();
    expect(normalizeTesterCode("P".repeat(13))).toBeNull();
  });
});

const run = (patch: Partial<PlaytestRun>): PlaytestRun => ({
  testerCode: "P01",
  round: 1,
  levelId: "police-money-laundering",
  endedBy: "player",
  hangupT: 60,
  shouldHangUpAt: 20,
  score: 70,
  grade: "close",
  complied: false,
  leakedCount: 1,
  createdAt: "2026-10-11T00:00:00Z",
  ...patch,
});

describe("summarizePlaytest", () => {
  const runs = [
    run({ testerCode: "P01", round: 1, hangupT: 60, score: 70 }),
    run({ testerCode: "P01", round: 2, hangupT: 25, score: 100 }),
    run({ testerCode: "P02", round: 1, hangupT: 180, score: 0, complied: true, endedBy: "timeout" }),
    run({ testerCode: "P02", round: 2, hangupT: 0, score: 100, endedBy: "declined" }),
  ];

  it("compares round 1 vs round 2", () => {
    const { rounds } = summarizePlaytest(runs);
    expect(rounds).toEqual([
      { round: 1, runs: 2, avgScore: 35, avgHangupT: 120, avgLateSeconds: 100, compliedRate: 0.5 },
      { round: 2, runs: 2, avgScore: 100, avgHangupT: 12.5, avgLateSeconds: 2.5, compliedRate: 0 },
    ]);
  });

  it("lists each tester per round", () => {
    const { testers } = summarizePlaytest(runs);
    expect(testers.map((t) => t.testerCode)).toEqual(["P01", "P02"]);
    expect(testers[0].rounds[2]).toEqual({ score: 100, hangupT: 25, lateSeconds: 5 });
  });

  it("counts a declined call as not late", () => {
    expect(lateSeconds({ endedBy: "declined", hangupT: 0, shouldHangUpAt: 30 })).toBe(0);
  });

  it("exports CSV with a BOM and one row per run", () => {
    const csv = playtestCsv(runs);
    expect(csv.startsWith("﻿tester_code,round,")).toBe(true);
    expect(csv.trim().split("\n")).toHaveLength(runs.length + 1);
  });
});
