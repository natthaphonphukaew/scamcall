import { describe, expect, it } from "vitest";
import bankFixture from "@/fixtures/calls/bank-2026-10-11.json";
import fixture from "@/fixtures/calls/police-2026-10-10.json";
import { getScenario } from "@/lib/scenarios/load";
import type { CallSession } from "@/lib/types";
import { buildAnalysisPrompt } from "./buildAnalysisPrompt";
import { emptyAnalysis, normalizeAnalysis } from "./normalize";
import { BadSessionError, MAX_TURN_CHARS, parseCallSession } from "./validate";

const real = fixture as CallSession;
const police = getScenario("police-money-laundering")!;

describe("normalizeAnalysis", () => {
  it("takes text and time from the transcript, not from the model", () => {
    const r = normalizeAnalysis(
      { scammerTurns: [{ index: 0, tactics: ["authority"], pressure: 2 }], shouldHangUpIndex: 4 },
      real,
    );
    expect(r.turns).toHaveLength(real.turns.length);
    expect(r.turns[0]).toEqual({
      t: 3,
      speaker: "scammer",
      text: real.turns[0].text,
      tactics: ["authority"],
      pressure: 2,
    });
    expect(r.shouldHangUpAt).toBe(27);
  });

  it("drops unknown tactics, clamps pressure and gives player turns no tactics", () => {
    const r = normalizeAnalysis(
      {
        scammerTurns: [
          { index: 2, tactics: ["fear", "hypnosis", "fear"], pressure: 42 },
          { index: 1, tactics: ["fear"], pressure: 3 },
        ],
      },
      real,
    );
    expect(r.turns[2]).toMatchObject({ tactics: ["fear"], pressure: 10 });
    expect(r.turns[1]).toMatchObject({ speaker: "player", tactics: [] });
    // ผู้เล่นใช้ความกดดันล่าสุดของคนร้าย → กราฟต่อเนื่อง
    expect(r.turns[3].pressure).toBe(10);
  });

  it("falls back when shouldHangUpIndex points at a player turn or is missing", () => {
    expect(normalizeAnalysis({ shouldHangUpIndex: 3 }, real).shouldHangUpAt).toBe(27); // → next scammer turn
    const r = normalizeAnalysis({ scammerTurns: [{ index: 6, tactics: [], pressure: 7 }] }, real);
    expect(r.shouldHangUpAt).toBe(51); // first scammer turn with pressure ≥ 5
    expect(normalizeAnalysis({}, real).shouldHangUpAt).toBe(3); // first scammer turn
  });

  it("keeps only known leak categories and always adds leaks the mask caught", () => {
    const session: CallSession = {
      ...real,
      turns: [{ id: "0", t: 1, speaker: "player", text: "[เลขบัญชี]", redactions: ["bank_account"] }],
    };
    const r = normalizeAnalysis({ leakedInfo: ["ชื่อ-นามสกุล", "ความลับจักรวาล"] }, session);
    expect(r.leakedInfo).toEqual(["ชื่อ-นามสกุล", "เลขบัญชี"]);
  });

  it("only trusts strict booleans and caps tips at 4", () => {
    const r = normalizeAnalysis({ complied: "yes", saidCallback: true, tips: ["a", " ", "b", "c", "d", "e"] }, real);
    expect(r.complied).toBe(false);
    expect(r.saidCallback).toBe(true);
    expect(r.tips).toEqual(["a", "b", "c", "d"]);
  });
});

describe("emptyAnalysis", () => {
  it("explains a declined call without calling the model", () => {
    const r = emptyAnalysis({ ...real, endedBy: "declined", turns: [] });
    expect(r.summary).toContain("ไม่รับสาย");
    expect(r.tips[0]).toContain("1441");
  });
});

describe("parseCallSession", () => {
  it.each([
    ["police", real],
    ["bank", bankFixture as CallSession],
  ])("accepts the real %s fixture unchanged", (_name, fixture) => {
    const parsed = parseCallSession(fixture);
    expect(parsed.turns.map((t) => t.text)).toEqual(fixture.turns.map((t) => t.text));
  });

  it("re-masks text on the server even if the client did not", () => {
    const s = parseCallSession({
      ...real,
      turns: [{ id: "x", t: 1, speaker: "player", text: "บัตร 1234567890123", redactions: [] }],
    });
    expect(s.turns[0].text).toBe("บัตร [เลขบัตรประชาชน]");
    expect(s.turns[0].redactions).toEqual(["national_id"]);
  });

  it("truncates very long turns", () => {
    const s = parseCallSession({ ...real, turns: [{ t: 1, speaker: "player", text: "ก".repeat(5000) }] });
    expect(s.turns[0].text.length).toBe(MAX_TURN_CHARS);
  });

  it.each([
    ["not an object", null],
    ["bad endedBy", { ...real, endedBy: "hacked" }],
    ["bad speaker", { ...real, turns: [{ t: 1, speaker: "admin", text: "x" }] }],
    ["negative time", { ...real, turns: [{ t: -1, speaker: "player", text: "x" }] }],
    ["too many turns", { ...real, turns: Array(201).fill({ t: 1, speaker: "player", text: "x" }) }],
  ])("rejects %s", (_name, body) => {
    expect(() => parseCallSession(body)).toThrow(BadSessionError);
  });
});

describe("buildAnalysisPrompt", () => {
  const prompt = buildAnalysisPrompt(real, police);

  it("numbers every turn so the model can answer by index", () => {
    expect(prompt).toContain("[0] คนร้าย (3 วินาที)");
    expect(prompt).toContain(`[${real.turns.length - 1}]`);
  });

  it("includes the level's correct exit, every tactic id and the ASR warning", () => {
    expect(prompt).toContain(police.correctExit);
    for (const id of ["authority", "fear", "urgency", "isolation", "legitimacy", "info_request", "money_request", "rapport"]) {
      expect(prompt).toContain(id);
    }
    expect(prompt).toContain("ถอดผิด");
  });
});
