"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COPY, ENDED_BY_LABELS } from "@/lib/copy";
import { playSfx, type Sfx } from "@/lib/sfx";
import type { ScoreResult } from "@/lib/types";
import { Confetti, seedFrom } from "./Confetti";
import { PressureChart } from "./PressureChart";
import { GameResult } from "./GameResult";
import { ScoreCard } from "./ScoreCard";
import type { XRayScreenProps } from "./types";
import { useReveal } from "./useReveal";

const VERDICT_SFX: Record<ScoreResult["grade"], Sfx> = { strong: "success", close: "close", scammed: "fail" };
import { XRayTimeline } from "./XRayTimeline";

// Scam X-Ray (Phase 4B): เปิดผลแบบ dramatic ตามลำดับใน useReveal — กด "ข้าม" ได้ตลอด
// รายละเอียด (กราฟ/ไทม์ไลน์/บทเรียน) ขึ้นหลังประทับผล · props ตาม components/xray/types.ts
export function XRayScreen({ level, session, analysis, score, game, onRetryLevel, onBackToCampus }: XRayScreenProps) {
  const hangupT = session.endedBy === "declined" ? null : session.hangupT;
  const { stage, play, skip } = useReveal(session.sessionId);
  const showDetails = stage === "details" || stage === "done";

  // เสียงตอนประทับผล (เฉพาะรอบแรกที่เล่นลำดับเปิดผล)
  useEffect(() => {
    if (play && stage === "verdict") playSfx(VERDICT_SFX[score.grade]);
  }, [play, stage, score.grade]);

  return (
    <Screen className="gap-5">
      {stage !== "done" && (
        <button
          type="button"
          onClick={skip}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 rounded-full bg-white/15 px-4 py-2 text-sm text-text backdrop-blur"
        >
          {COPY.skip}
        </button>
      )}
      {play && stage !== "count" && score.grade === "strong" && <Confetti seed={seedFrom(session.sessionId)} />}

      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-xray">{COPY.xrayTitle}</p>
          <h1 className="text-xl font-bold">{level.title}</h1>
          <p className="text-sm text-muted">
            {level.callerId} · {ENDED_BY_LABELS[session.endedBy]}
          </p>
        </div>
        <SoundToggle className="shrink-0" />
      </header>

      <ScoreCard score={score} stage={stage} play={play} />

      {showDetails && (
        <motion.div
          initial={play ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5"
        >
          {analysis.summary && <p className="leading-relaxed">{analysis.summary}</p>}

          <PressureChart
            play={play}
            turns={analysis.turns}
            channel={session.channel ?? "call"}
            shouldHangUpAt={analysis.shouldHangUpAt}
            hangupT={hangupT}
          />

          <section className="rounded-card bg-surface-raised p-4 text-sm">
            <h2 className="mb-1 font-bold">{COPY.leakedTitle}</h2>
            <p className={analysis.leakedInfo.length > 0 ? "text-danger" : "text-muted"}>
              {analysis.leakedInfo.length > 0 ? analysis.leakedInfo.join(" · ") : COPY.noLeaks}
            </p>
          </section>

          <XRayTimeline
            play={play}
            turns={analysis.turns}
            channel={session.channel ?? "call"}
            shouldHangUpAt={analysis.shouldHangUpAt}
            hangupT={hangupT}
          />

          <section className="flex flex-col gap-3">
            <h2 className="font-bold">{COPY.lessonsTitle}</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              {analysis.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <div className="rounded-card bg-surface-raised p-4">
              <p className="text-sm font-bold text-accept">{COPY.correctExitTitle}</p>
              <p>{level.correctExit}</p>
            </div>
          </section>

          <GameResult {...game} />

          <footer className="flex flex-col gap-2">
            <Button variant="accept" onClick={onRetryLevel}>
              {COPY.restart}
            </Button>
            <Button onClick={onBackToCampus}>{COPY.backToCampus}</Button>
          </footer>
        </motion.div>
      )}
    </Screen>
  );
}
