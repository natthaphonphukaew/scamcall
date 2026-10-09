import { describe, expect, it } from "vitest";
import { CALL_ANSWERED_CUE, SAFE_WORD } from "@/lib/live/constants";
import { buildSystemPrompt } from "./buildSystemPrompt";
import { getScenario, listScenarios, parseScenario, ScenarioError, toPublicScenario } from "./load";

const police = getScenario("police-money-laundering");

describe("load", () => {
  it("loads the first level", () => {
    expect(police).not.toBeNull();
    expect(police?.callerId).toBe("สภ.เมืองนนทบุรี");
  });

  it("returns null for unknown ids", () => {
    expect(getScenario("nope")).toBeNull();
  });

  it("every registered scenario is valid and has a unique id", () => {
    const ids = listScenarios().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rejects broken scenario JSON with a clear message", () => {
    const broken = { ...police, difficulty: 5 };
    expect(() => parseScenario(broken)).toThrow(ScenarioError);
    expect(() => parseScenario(broken)).toThrow(/difficulty/);
    expect(() => parseScenario({ ...police, escalationSteps: [] })).toThrow(/escalationSteps/);
    expect(() => parseScenario(null)).toThrow(ScenarioError);
  });

  it("public scenario hides prompt material", () => {
    const pub = toPublicScenario(police!);
    expect(Object.keys(pub).sort()).toEqual(["callerId", "difficulty", "id", "title"]);
  });
});

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt(police!);

  it("states this is a training simulation (CLAUDE.md 7.4)", () => {
    expect(prompt).toContain("การจำลองเพื่อการฝึก");
    expect(prompt).toContain("นักศึกษา");
  });

  it("forbids asking for real sensitive data (CLAUDE.md 7.2)", () => {
    for (const word of ["เลขบัญชี", "เลขบัตร", "OTP", "รหัสผ่าน", "เลขบัตรประชาชน"]) {
      expect(prompt).toContain(word);
    }
    expect(prompt).toContain("ห้ามขอ");
    expect(prompt).toContain("ห้ามพูดเลขบัญชีปลายทาง");
  });

  it("forbids abuse and new scam techniques (CLAUDE.md 7.4)", () => {
    expect(prompt).toContain("ห้ามใช้คำหยาบคาย");
    expect(prompt).toContain("ห้ามคุกคามทางเพศ");
    expect(prompt).toContain("ห้ามคิดหรือสอนกลโกงรูปแบบใหม่");
  });

  it("has a safe word and a distress exit", () => {
    expect(prompt).toContain(SAFE_WORD);
    expect(prompt).toContain("ทุกข์ใจ");
  });

  it("includes every part of the scenario", () => {
    const s = police!;
    expect(prompt).toContain(s.persona);
    expect(prompt).toContain(s.callerId);
    expect(prompt).toContain(s.openingLine);
    expect(prompt).toContain(CALL_ANSWERED_CUE);
    for (const step of s.escalationSteps) expect(prompt).toContain(step);
    for (const info of s.targetInfo) expect(prompt).toContain(info);
    for (const v of Object.values(s.fakeVictimProfile)) expect(prompt).toContain(v);
  });

  it("puts safety rules before the role", () => {
    expect(prompt.indexOf("กฎความปลอดภัย")).toBeLessThan(prompt.indexOf("บทของคุณ"));
  });
});
