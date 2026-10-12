"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// ลำดับการเปิดผล Scam X-Ray (Phase 4B): สแกน + คะแนนนับขึ้น → ประทับผล (confetti/glitch) → รายละเอียดทั้งหมด
// เล่นครั้งเดียวต่อสาย (refresh แล้วเห็นผลเลย) · reduced motion = ข้ามไปผลสุดท้ายทันที

export type RevealStage = "count" | "verdict" | "details" | "done";

/** เวลา (ms) ที่เข้าแต่ละขั้น นับจากเปิดหน้า */
export const REVEAL_TIMING = { verdict: 1300, details: 2200, done: 4200 } as const;
/** ระยะเวลาที่คะแนนนับขึ้น (วินาที) — ต้องจบก่อนประทับผล */
export const COUNT_SECONDS = 1.1;

const seenKey = (id: string) => `scamcall:xray-seen:${id}`;

function wasSeen(id: string): boolean {
  try {
    return sessionStorage.getItem(seenKey(id)) === "1";
  } catch {
    return false;
  }
}

function markSeen(id: string): void {
  try {
    sessionStorage.setItem(seenKey(id), "1");
  } catch {
    // private mode — เล่นซ้ำได้ ไม่เป็นไร
  }
}

export function useReveal(sessionId: string): { stage: RevealStage; play: boolean; skip: () => void } {
  const still = useReducedMotion() === true;
  const [firstTime] = useState(() => !wasSeen(sessionId));
  const [stage, setStage] = useState<RevealStage>(firstTime ? "count" : "done");
  const [skipped, setSkipped] = useState(false);
  const play = firstTime && !still && !skipped;

  useEffect(() => {
    if (!play) return;
    const timers = [
      window.setTimeout(() => setStage("verdict"), REVEAL_TIMING.verdict),
      window.setTimeout(() => setStage("details"), REVEAL_TIMING.details),
      window.setTimeout(() => setStage("done"), REVEAL_TIMING.done),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [play]);

  useEffect(() => {
    if (stage === "done") markSeen(sessionId);
  }, [stage, sessionId]);

  return {
    stage: play ? stage : "done",
    play,
    skip: () => {
      setSkipped(true);
      setStage("done");
    },
  };
}
