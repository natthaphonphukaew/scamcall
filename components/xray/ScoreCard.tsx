import { COPY, GRADE_LABELS } from "@/lib/copy";
import type { ScoreResult } from "@/lib/types";

const GRADE_TONE: Record<ScoreResult["grade"], string> = {
  strong: "text-accept",
  close: "text-scammer",
  scammed: "text-danger",
};

export function ScoreCard({ score }: { score: ScoreResult }) {
  return (
    <section className="rounded-card bg-surface-raised p-4" aria-label={COPY.scoreTitle}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-6xl font-bold">{score.score}</p>
        <p className={`text-lg font-bold ${GRADE_TONE[score.grade]}`}>{GRADE_LABELS[score.grade]}</p>
      </div>
      <ul className="mt-3 flex flex-col gap-1 text-sm">
        {score.breakdown.map((b, i) => (
          <li key={i} className="flex justify-between gap-3 text-muted">
            <span>{b.label}</span>
            <span className="tabular-nums text-text">{b.delta > 0 && i > 0 ? `+${b.delta}` : b.delta}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
