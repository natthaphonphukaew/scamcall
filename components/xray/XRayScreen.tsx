import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COPY, ENDED_BY_LABELS } from "@/lib/copy";
import { PressureChart } from "./PressureChart";
import { GameResult } from "./GameResult";
import { ScoreCard } from "./ScoreCard";
import type { XRayScreenProps } from "./types";
import { XRayTimeline } from "./XRayTimeline";

// Week 3: โครงเรียบ — ดีไซน์จริงทำทีหลัง (props ตาม components/xray/types.ts)
export function XRayScreen({
  level,
  session,
  analysis,
  score,
  game,
  onRetryLevel,
  onBackToCampus,
}: XRayScreenProps) {
  const hangupT = session.endedBy === "declined" ? null : session.hangupT;

  return (
    <Screen className="gap-5">
      <header>
        <p className="text-sm text-muted">{COPY.xrayTitle}</p>
        <h1 className="text-xl font-bold">{level.title}</h1>
        <p className="text-sm text-muted">
          {level.callerId} · {ENDED_BY_LABELS[session.endedBy]}
        </p>
      </header>

      <ScoreCard score={score} />

      {analysis.summary && <p className="leading-relaxed">{analysis.summary}</p>}

      <PressureChart
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
    </Screen>
  );
}
