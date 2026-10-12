"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { COPY, GRADE_LABELS } from "@/lib/copy";
import type { ScoreResult } from "@/lib/types";
import { GlitchText } from "./GlitchText";
import { COUNT_SECONDS, type RevealStage } from "./useReveal";

// การ์ดคะแนน (Phase 4B): เส้นสแกนกวาด → คะแนนนับขึ้น → ประทับผล (scammed = glitch + การ์ดสั่น)

const GRADE_TONE: Record<ScoreResult["grade"], string> = {
  strong: "text-accept",
  close: "text-scammer",
  scammed: "text-danger",
};

const GRADE_RING: Record<ScoreResult["grade"], string> = {
  strong: "ring-accept/40",
  close: "ring-scammer/40",
  scammed: "ring-danger/50",
};

export function ScoreCard({ score, stage, play }: { score: ScoreResult; stage: RevealStage; play: boolean }) {
  const count = useMotionValue(play ? 0 : score.score);
  const shown = useTransform(count, (v) => Math.round(v));
  const showVerdict = stage !== "count";
  const showBreakdown = stage === "details" || stage === "done";
  const shake = play && stage === "verdict" && score.grade === "scammed";

  useEffect(() => {
    if (!play) {
      count.set(score.score);
      return;
    }
    const controls = animate(count, score.score, { duration: COUNT_SECONDS, ease: "easeOut", delay: 0.2 });
    return () => controls.stop();
  }, [play, score.score, count]);

  return (
    <motion.section
      aria-label={COPY.scoreTitle}
      animate={shake ? { x: [0, -10, 10, -6, 6, -2, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-card bg-surface-raised p-5 ring-1 ${showVerdict ? GRADE_RING[score.grade] : "ring-xray/30"}`}
    >
      {play && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-xray/35 to-transparent"
          initial={{ y: "-120%" }}
          animate={{ y: "520%" }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      )}

      <p className="text-[11px] font-medium tracking-[0.2em] text-xray">{COPY.xrayKicker}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-7xl font-bold tabular-nums leading-none">
          <motion.span>{shown}</motion.span>
        </p>
        {showVerdict && (
          <motion.div
            initial={play ? { scale: 1.8, opacity: 0, rotate: -12 } : false}
            animate={{ scale: 1, opacity: 1, rotate: -4 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
            className={`text-right font-bold ${GRADE_TONE[score.grade]}`}
          >
            {score.grade === "scammed" ? (
              <>
                <GlitchText text={COPY.scammedStamp} className="text-3xl tracking-wider" />
                <p className="text-sm">{GRADE_LABELS.scammed}</p>
              </>
            ) : (
              <p className="rounded-md border-2 border-current px-2 py-1 text-lg">{GRADE_LABELS[score.grade]}</p>
            )}
          </motion.div>
        )}
      </div>

      {showBreakdown && (
        <motion.ul
          initial={play ? { opacity: 0, height: 0 } : false}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 flex flex-col gap-1 text-sm"
        >
          {score.breakdown.map((b, i) => (
            <li key={i} className="flex justify-between gap-3 text-muted">
              <span>{b.label}</span>
              <span className="tabular-nums text-text">{b.delta > 0 && i > 0 ? `+${b.delta}` : b.delta}</span>
            </li>
          ))}
        </motion.ul>
      )}
    </motion.section>
  );
}
