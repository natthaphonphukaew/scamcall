import { describe, expect, it } from "vitest";
import { buildAnalysisPrompt } from "@/lib/analysis/buildAnalysisPrompt";
import { isOnTime } from "@/lib/game/progression";
import { SAFE_WORD } from "@/lib/live/constants";
import { buildChatSystemPrompt, buildChatTurnPrompt } from "@/lib/scenarios/buildChatPrompt";
import { buildSystemPrompt } from "@/lib/scenarios/buildSystemPrompt";
import { getScenario, listScenariosByChannel, toChatIntro, toPublicScenario } from "@/lib/scenarios/load";
import { computeScore, lateChatMessages } from "@/lib/scoring";
import type { AnalysisResult, CallSession, ResultPayload, TranscriptTurn } from "@/lib/types";
import { MAX_CHAT_MESSAGES } from "./constants";
import { LINK_PLACEHOLDER, sanitizeHistoryMessage, sanitizeReply, stripLinks, toExampleDomain } from "./sanitize";
import { chatToSession, typingDelayMs, type ChatUiMessage } from "./session";
import { BadChatError, parseChatRequest } from "./validate";

const investment = getScenario("investment-chat")!;
const job = getScenario("online-job-chat")!;

describe("chat levels", () => {
  it("both chat levels load as channel chat with an opening and allowed cards", () => {
    for (const s of [investment, job]) {
      expect(s.channel).toBe("chat");
      expect(toChatIntro(s).openingMessages.length).toBeGreaterThan(0);
      expect(s.chatProps?.length).toBeGreaterThan(0);
    }
  });

  it("splits levels by channel and exposes the channel publicly", () => {
    expect(
      listScenariosByChannel("chat")
        .map((s) => s.id)
        .sort(),
    ).toEqual(["investment-chat", "online-job-chat"]);
    expect(listScenariosByChannel("call").every((s) => s.channel === "call")).toBe(true);
    expect(toPublicScenario(job).channel).toBe("chat");
  });

  it("the opening messages contain no links or long numbers", () => {
    for (const s of [investment, job]) {
      for (const m of toChatIntro(s).openingMessages) {
        expect(stripLinks(m)).toBe(m);
        expect(m).not.toMatch(/\d{5,}/);
      }
    }
  });
});

describe("buildChatSystemPrompt", () => {
  const prompt = buildChatSystemPrompt(investment);

  it("states this is a training simulation (CLAUDE.md 7.4)", () => {
    expect(prompt).toContain("การจำลองเพื่อการฝึก");
    expect(prompt).toContain("นักศึกษา");
  });

  it("keeps the same safety rules as calls (CLAUDE.md 7.2, 7.4)", () => {
    for (const rule of ["เลขบัญชี", "OTP", "รหัสผ่าน", "เลขบัตรประชาชน", "ห้ามใช้คำหยาบคาย", "ห้ามคุกคามทางเพศ"]) {
      expect(prompt).toContain(rule);
    }
    expect(prompt).toContain("ห้ามคิดหรือสอนกลโกงรูปแบบใหม่");
    expect(prompt).toContain("ห้ามพิมพ์ลิงก์");
    expect(prompt).toContain(".example");
    expect(prompt).toContain(SAFE_WORD);
  });

  it("only offers the cards this level allows", () => {
    const linkOnly = buildChatSystemPrompt({ ...investment, chatProps: ["link"] });
    expect(linkOnly).toContain("การ์ดลิงก์");
    expect(linkOnly).not.toContain("สลิปโอนเงิน");
    expect(buildChatSystemPrompt({ ...investment, chatProps: [] })).toContain('ห้ามใส่ field "prop"');
  });

  it("the turn prompt carries the history and asks for a nudge when the player is silent", () => {
    const history = [
      {
        speaker: "scammer" as const,
        text: "สวัสดีค่ะ",
        prop: { kind: "link" as const, title: "สมัคร", domain: "vip.example" },
      },
      { speaker: "player" as const, text: "ใครคะ" },
    ];
    expect(buildChatTurnPrompt(history, false)).toContain("ผู้ใช้: ใครคะ");
    expect(buildChatTurnPrompt(history, false)).toContain("vip.example");
    expect(buildChatTurnPrompt(history, true)).toContain("ทักซ้ำ");
  });

  it("call prompts are untouched by the chat work", () => {
    expect(buildSystemPrompt(getScenario("police-money-laundering")!)).not.toContain("แชท");
  });
});

describe("sanitizeReply", () => {
  const kinds = investment.chatProps!;

  it("replaces links and website names in message text", () => {
    expect(stripLinks("สมัครที่ https://evil.com/x ด่วน")).toBe(`สมัครที่ ${LINK_PLACEHOLDER} ด่วน`);
    expect(stripLinks("เข้า www.vip-profit.net หรือ vip-profit.co.th")).toBe(
      `เข้า ${LINK_PLACEHOLDER} หรือ ${LINK_PLACEHOLDER}`,
    );
    expect(stripLinks("กำไร 30% ใน 1.5 เดือน")).toBe("กำไร 30% ใน 1.5 เดือน");
  });

  it("forces link cards onto .example domains", () => {
    expect(toExampleDomain("vip-member.example")).toBe("vip-member.example");
    expect(toExampleDomain("https://real-bank.com/login")).toBe("real-bank.example");
    expect(toExampleDomain(42)).toBe("member-portal.example");
  });

  it("masks account-like numbers, keeps max 3 messages and at most one card", () => {
    const out = sanitizeReply(
      {
        messages: [
          { text: "โอนมาที่ 123-4-56789-0 นะคะ", prop: { kind: "slip", amount: 500, note: "ถอนกำไร" } },
          { text: "ดูนี่", prop: { kind: "profit", title: "กำไร", percent: 30 } },
          { text: "ด่วนเลย" },
          { text: "ข้อความที่สี่" },
        ],
      },
      kinds,
    );
    expect(out).toHaveLength(3);
    expect(out[0].text).toContain("[เลขบัญชี]");
    expect(out[0].prop?.kind).toBe("slip");
    expect(out[1].prop).toBeUndefined();
  });

  it("drops cards the level does not allow and messages with nothing left", () => {
    const out = sanitizeReply(
      { messages: [{ text: "", prop: { kind: "link", title: "x", domain: "x.example" } }, { text: "สวัสดี" }] },
      ["profit"],
    );
    expect(out).toEqual([{ text: "สวัสดี" }]);
    expect(sanitizeReply({}, kinds)).toEqual([]);
  });

  it("re-masks player messages that come back from the browser", () => {
    const m = sanitizeHistoryMessage({ speaker: "player", text: "เลขบัตร 1234 5678 9012 3456" }, kinds, 500);
    expect(m.text).not.toMatch(/\d{4} \d{4}/);
  });
});

describe("parseChatRequest", () => {
  const ok = { levelId: "investment-chat", history: [{ speaker: "player", text: "สวัสดี" }] };

  it("accepts a normal request", () => {
    expect(parseChatRequest(ok)).toMatchObject({ levelId: "investment-chat", nudge: false });
  });

  it("rejects broken bodies, long messages and chats over the limit", () => {
    expect(() => parseChatRequest(null)).toThrow(BadChatError);
    expect(() => parseChatRequest({ ...ok, history: [] })).toThrow(BadChatError);
    expect(() => parseChatRequest({ ...ok, history: [{ speaker: "admin", text: "x" }] })).toThrow(BadChatError);
    expect(() => parseChatRequest({ ...ok, history: [{ speaker: "player", text: "ก".repeat(501) }] })).toThrow();
    const full = Array.from({ length: MAX_CHAT_MESSAGES }, () => ({ speaker: "player", text: "x" }));
    expect(() => parseChatRequest({ ...ok, history: full })).toThrow(/limit/);
  });
});

describe("chat → session", () => {
  const msg = (speaker: "scammer" | "player", t: number, extra: Partial<ChatUiMessage> = {}): ChatUiMessage => ({
    id: `${speaker}-${t}`,
    speaker,
    text: speaker === "scammer" ? "คนร้าย" : "ผู้เล่น",
    t,
    redactions: [],
    ...extra,
  });

  it("produces a CallSession with channel chat and cards described in the text", () => {
    const s = chatToSession({
      sessionId: "c1",
      levelId: "investment-chat",
      startedAt: "a",
      endedAt: "b",
      endedBy: "player",
      hangupT: 12,
      messages: [msg("scammer", 1, { prop: { kind: "profit", title: "กำไรสมาชิก", percent: 30 } }), msg("player", 5)],
    });
    expect(s.channel).toBe("chat");
    expect(s.turns[0].text).toContain("+30%");
    expect(s.turns.map((t) => t.speaker)).toEqual(["scammer", "player"]);
  });

  it("typing delay grows with the message but stays short", () => {
    expect(typingDelayMs("")).toBe(800);
    expect(typingDelayMs("ก".repeat(500))).toBe(2800);
    expect(typingDelayMs("สวัสดีค่ะ", true)).toBeGreaterThan(typingDelayMs("สวัสดีค่ะ"));
  });
});

describe("chat scoring (by messages, not seconds)", () => {
  const turn = (speaker: "scammer" | "player", t: number): TranscriptTurn => ({
    id: String(t),
    t,
    speaker,
    text: "x",
    redactions: [],
  });
  const chat = (turns: TranscriptTurn[], patch: Partial<CallSession> = {}): CallSession => ({
    sessionId: "c",
    levelId: "investment-chat",
    channel: "chat",
    startedAt: "",
    endedAt: "",
    endedBy: "player",
    hangupT: 300,
    turns,
    ...patch,
  });
  const analysis = (shouldHangUpAt: number): AnalysisResult => ({
    turns: [],
    shouldHangUpAt,
    leakedInfo: [],
    complied: false,
    saidCallback: false,
    summary: "",
    tips: [],
  });

  it("blocking within one message of the danger point is on time, however long it took", () => {
    const s = chat([turn("scammer", 5), turn("scammer", 40), turn("player", 200), turn("scammer", 210)]);
    expect(lateChatMessages(s, 40)).toBe(0);
    expect(computeScore(s, analysis(40))).toMatchObject({ score: 100, grade: "strong" });
  });

  it("each extra scammer message after the grace costs points", () => {
    const turns = [turn("scammer", 5), ...[10, 20, 30, 40, 50].map((t) => turn("scammer", t))];
    const score = computeScore(chat(turns), analysis(5));
    expect(score.breakdown[0].label).toContain("4 ข้อความ");
    expect(score.score).toBe(60);
  });

  it("chatting until the limit is like letting the call time out", () => {
    const score = computeScore(chat([turn("scammer", 1)], { endedBy: "timeout" }), analysis(1));
    expect(score.score).toBe(40);
  });

  it("the call scoring still uses seconds", () => {
    const call = chat([turn("scammer", 1)], { channel: undefined, hangupT: 100 });
    expect(computeScore(call, analysis(1)).breakdown[0].label).toContain("วินาที");
  });

  it("the on-time XP bonus follows the chat grade", () => {
    const base: Pick<
      ResultPayload,
      | "levelId"
      | "channel"
      | "endedBy"
      | "score"
      | "complied"
      | "saidCallback"
      | "leakedCount"
      | "hangupT"
      | "shouldHangUpAt"
    > = {
      levelId: "investment-chat",
      channel: "chat",
      endedBy: "player",
      score: 100,
      complied: false,
      saidCallback: false,
      leakedCount: 0,
      hangupT: 300,
      shouldHangUpAt: 10,
    };
    expect(isOnTime({ ...base, grade: "strong" })).toBe(true);
    expect(isOnTime({ ...base, grade: "close" })).toBe(false);
  });

  it("the X-Ray prompt explains the chat rules only for chat levels", () => {
    const s = chat([turn("scammer", 1)]);
    expect(buildAnalysisPrompt(s, investment)).toContain("บล็อก");
    expect(buildAnalysisPrompt(s, getScenario("police-money-laundering")!)).not.toContain("ช่องทาง: แชท");
  });
});
