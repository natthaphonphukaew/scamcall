import { describe, expect, it } from "vitest";
import {
  ALIAS_IDENTITIES,
  ALIAS_PREFIXES,
  ALIAS_SUFFIXES,
  formatAlias,
  isAvatarId,
  isValidAliasParts,
  randomAliasParts,
  rerollAliasPart,
} from "./alias";
import { computeBoards } from "./boards";
import {
  earnedBadges,
  earnedTitles,
  isSaved,
  levelForXp,
  thaiDayKey,
  xpForPlay,
  xpToReach,
} from "./progression";
import type { PlayerProfile, PlayRecord } from "./types";

const NOW = new Date("2026-10-11T05:00:00Z"); // 12:00 เวลาไทย

const play = (patch: Partial<PlayRecord> = {}): PlayRecord => ({
  sessionId: Math.random().toString(36),
  levelId: "police-money-laundering",
  channel: "call",
  endedBy: "player",
  score: 100,
  grade: "strong",
  complied: false,
  saidCallback: false,
  leakedCount: 0,
  hangupT: 20,
  shouldHangUpAt: 16,
  xp: 150,
  saved: true,
  createdAt: "2026-10-10T05:00:00Z",
  ...patch,
});

describe("alias", () => {
  it("formats three parts into a Thai alias", () => {
    expect(formatAlias([0, 0, 0])).toBe(`${ALIAS_PREFIXES[0]} ${ALIAS_IDENTITIES[0]} ${ALIAS_SUFFIXES[0]}`);
  });

  it("validates indices strictly", () => {
    expect(isValidAliasParts([0, 1, 2])).toBe(true);
    expect(isValidAliasParts([0, 1])).toBe(false);
    expect(isValidAliasParts([0, 1, ALIAS_SUFFIXES.length])).toBe(false);
    expect(isValidAliasParts([0, 1.5, 2])).toBe(false);
    expect(isValidAliasParts("ท่าน")).toBe(false);
  });

  it("random aliases are always valid, and rerolling one slot always changes it", () => {
    for (let i = 0; i < 50; i++) {
      const parts = randomAliasParts();
      expect(isValidAliasParts(parts)).toBe(true);
      const next = rerollAliasPart(parts, 1);
      expect(next[1]).not.toBe(parts[1]);
      expect([next[0], next[2]]).toEqual([parts[0], parts[2]]);
      expect(isValidAliasParts(next)).toBe(true);
    }
  });

  it("knows the avatar ids", () => {
    expect(isAvatarId("cat")).toBe(true);
    expect(isAvatarId("toString")).toBe(false);
  });
});

describe("xpForPlay", () => {
  const outcome = play();

  it("rewards the right behaviour: grade + on time + no leak + callback", () => {
    const r = xpForPlay({ ...outcome, saidCallback: true }, [], NOW);
    expect(r.xp).toBe(100 + 30 + 20 + 20);
    expect(r.multiplier).toBe(1);
  });

  it("gives a declined call a flat 30 (safe, but no practice)", () => {
    expect(xpForPlay({ ...outcome, endedBy: "declined", hangupT: 0 }, [], NOW).xp).toBe(30);
  });

  it("gives no on-time or no-leak bonus when the player complied", () => {
    const r = xpForPlay({ ...outcome, grade: "scammed", score: 0, complied: true }, [], NOW);
    expect(r.xp).toBe(20);
  });

  it("halves XP for repeats and stops after 3 plays of the same level in a Thai day", () => {
    const todayFresh = (n: number) =>
      Array.from({ length: n }, () => play({ saved: false, createdAt: "2026-10-11T04:00:00Z" }));
    const failed = { ...outcome, grade: "close" as const, score: 70 };
    expect(xpForPlay(failed, todayFresh(1), NOW).multiplier).toBe(0.5);
    expect(xpForPlay(failed, todayFresh(2), NOW).multiplier).toBe(0.5);
    expect(xpForPlay(failed, todayFresh(3), NOW).xp).toBe(0);
  });

  it("caps an already-saved level at 50% even on a new day", () => {
    const r = xpForPlay(outcome, [play({ saved: true, createdAt: "2026-10-01T05:00:00Z" })], NOW);
    expect(r.multiplier).toBe(0.5);
  });

  it("uses Thai time for the day boundary", () => {
    expect(thaiDayKey(new Date("2026-10-10T17:30:00Z"))).toBe("2026-10-11"); // 00:30 เวลาไทย
  });
});

describe("isSaved", () => {
  it("needs a good grade, no compliance, and actually facing the call", () => {
    expect(isSaved(play())).toBe(true);
    expect(isSaved(play({ grade: "close" }))).toBe(true);
    expect(isSaved(play({ grade: "scammed" }))).toBe(false);
    expect(isSaved(play({ complied: true }))).toBe(false);
    expect(isSaved(play({ endedBy: "declined" }))).toBe(false);
  });
});

describe("levelForXp", () => {
  it.each([
    [0, 1, "นักศึกษาใหม่"],
    [99, 1, "นักศึกษาใหม่"],
    [100, 2, "นักศึกษาใหม่"],
    [300, 3, "ผู้เริ่มรู้ทัน"],
    [xpToReach(5), 5, "นักสืบบางมด"],
    [xpToReach(12), 12, "ตำนานสายตัดไว"],
  ])("%i XP → level %i (%s)", (xp, level, title) => {
    expect(levelForXp(xp)).toMatchObject({ level, title });
  });

  it("reports progress inside the level", () => {
    expect(levelForXp(150)).toMatchObject({ level: 2, xpIntoLevel: 50, xpForLevel: 200 });
  });
});

describe("earnedBadges / earnedTitles", () => {
  const levels = ["a", "b"];

  it("awards first call, quick cut and campus guardian", () => {
    const plays = [play({ levelId: "a" }), play({ levelId: "b", hangupT: 200 })];
    const badges = earnedBadges(plays, levels);
    expect(badges).toEqual(expect.arrayContaining(["first_call", "quick_cut", "campus_guardian"]));
  });

  it("awards comeback only when a failed level is later beaten", () => {
    const fail = play({ levelId: "a", grade: "scammed", complied: true, saved: false, createdAt: "2026-10-01T00:00:00Z" });
    const win = play({ levelId: "a", grade: "strong", createdAt: "2026-10-02T00:00:00Z" });
    expect(earnedBadges([fail, win], levels)).toContain("comeback");
    expect(earnedBadges([win, { ...fail, createdAt: "2026-10-03T00:00:00Z" }], levels)).not.toContain("comeback");
  });

  it("does not count declined calls toward tight lips", () => {
    const declined = Array.from({ length: 5 }, () => play({ endedBy: "declined" }));
    expect(earnedBadges(declined, levels)).not.toContain("tight_lips");
  });

  it("gives funny titles for repeated compliance", () => {
    const scammed = (levelId: string) => play({ levelId, grade: "scammed", score: 0, complied: true, saved: false });
    expect(earnedTitles([scammed("a"), scammed("a"), scammed("b")])).toEqual(
      expect.arrayContaining(["too_kind", "gullible"]),
    );
  });
});

describe("computeBoards", () => {
  const profile = (patch: Partial<PlayerProfile> = {}): PlayerProfile => ({
    aliasParts: [0, 0, 0],
    avatar: "cat",
    showOnFunnyBoard: false,
    ...patch,
  });

  const playsByUser = new Map<string, PlayRecord[]>([
    ["u1", [play({ score: 100 }), play({ score: 90 }), play({ score: 95 })]],
    [
      "u2",
      [
        play({ score: 0, grade: "scammed", complied: true, createdAt: "2026-10-01T00:00:00Z" }),
        play({ score: 80, createdAt: "2026-10-02T00:00:00Z" }),
      ],
    ],
    ["u3", [play({ score: 0, grade: "scammed", complied: true })]],
  ]);
  const profiles = new Map([
    ["u1", profile({ aliasParts: [1, 1, 1] })],
    ["u2", profile({ showOnFunnyBoard: true })],
    ["u3", profile()], // ยอมโอนแต่ไม่ได้ opt-in
  ]);
  const boards = computeBoards(playsByUser, profiles, ["police-money-laundering"]);

  it("ranks resilience only for players with 3+ calls", () => {
    expect(boards.resilient).toHaveLength(1);
    expect(boards.resilient[0]).toMatchObject({ alias: formatAlias([1, 1, 1]), value: 95 });
  });

  it("ranks improvement from first to best score", () => {
    expect(boards.improved[0].value).toBe(80);
  });

  it("shows only opted-in players on the funny board", () => {
    expect(boards.funny.map((e) => e.value)).toEqual([1]);
  });

  it("never exposes user ids", () => {
    expect(JSON.stringify(boards)).not.toMatch(/u1|u2|u3/);
  });

  it("aggregates per-level stats anonymously", () => {
    expect(boards.levels[0]).toMatchObject({ plays: 6, scammedPercent: 33 });
  });
});
