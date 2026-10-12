import { describe, expect, it } from "vitest";
import { newlySaved } from "@/lib/campus/celebrate";
import { HANG_UP_GRACE_SECONDS } from "@/lib/scoring";
import { computeLevelStats } from "./boards";
import { earnedTitles, lateSecondsOf } from "./progression";
import type { PlayRecord } from "./types";

const play = (patch: Partial<PlayRecord> = {}): PlayRecord => ({
  sessionId: Math.random().toString(36),
  levelId: "police-money-laundering",
  channel: "call",
  endedBy: "player",
  score: 80,
  grade: "close",
  complied: false,
  saidCallback: false,
  leakedCount: 0,
  hangupT: 30,
  shouldHangUpAt: 10,
  xp: 60,
  saved: true,
  createdAt: "2026-10-12T10:00:00Z",
  ...patch,
});

describe("late seconds (game stats)", () => {
  it("subtracts the same grace window the score uses", () => {
    expect(lateSecondsOf({ endedBy: "player", hangupT: 10 + HANG_UP_GRACE_SECONDS, shouldHangUpAt: 10 })).toBe(0);
    expect(lateSecondsOf({ endedBy: "player", hangupT: 30, shouldHangUpAt: 10 })).toBe(30 - 10 - HANG_UP_GRACE_SECONDS);
    expect(lateSecondsOf({ endedBy: "declined", hangupT: 0, shouldHangUpAt: 10 })).toBe(0);
  });

  it("level stats ignore chat plays for the average (chats are scored by messages)", () => {
    const [call, chat] = computeLevelStats(
      [
        play({ levelId: "a", hangupT: 40 }),
        play({ levelId: "b", channel: "chat", hangupT: 400 }),
        play({ levelId: "b", channel: "chat", grade: "scammed" }),
      ],
      ["a", "b"],
    );
    expect(call.avgLateSeconds).toBe(40 - 10 - HANG_UP_GRACE_SECONDS);
    expect(chat.avgLateSeconds).toBeNull();
    expect(chat.plays).toBe(2);
    expect(chat.scammedPercent).toBe(50);
    expect(computeLevelStats([], ["a"])[0].avgLateSeconds).toBeNull();
  });

  it('"good listener" counts only long calls, not slow chats', () => {
    const slowChats = Array.from({ length: 3 }, () => play({ channel: "chat", hangupT: 600 }));
    expect(earnedTitles(slowChats)).not.toContain("good_listener");
    const longCalls = Array.from({ length: 3 }, () => play({ hangupT: 200 }));
    expect(earnedTitles(longCalls)).toContain("good_listener");
  });
});

describe("campus celebration", () => {
  it("celebrates only friends saved since the last visit", () => {
    expect(newlySaved(["a", "b", "c"], ["a"])).toEqual(["b", "c"]);
    expect(newlySaved(["a"], ["a", "b"])).toEqual([]);
    expect(newlySaved([], [])).toEqual([]);
  });
});
