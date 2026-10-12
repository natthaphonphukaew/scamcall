import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { PhoneIcon } from "@/components/ui/PhoneIcon";
import { TranscriptList } from "@/components/ui/TranscriptList";
import { COPY, ENDED_BY_LABELS } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import { REDACTION_LABELS } from "@/lib/privacy/mask";
import type { EndedScreenProps } from "./types";

// สรุปหลังวางสาย → ไปต่อที่ Scam X-Ray
export function EndedScreen({
  scenario,
  result,
  errorMessage,
  saved,
  onOpenXRay,
  onRestart,
  onBackToCampus,
}: EndedScreenProps) {
  const leaked = [
    ...new Set(result.turns.filter((t) => t.speaker === "player").flatMap((t) => t.redactions)),
  ];

  return (
    <Screen className="gap-4 bg-call">
      <header className="flex flex-col items-center text-center">
        <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-danger/20 text-danger">
          <PhoneIcon hangUp />
        </span>
        <p className="text-muted">{COPY.ended}</p>
        <h1 className="text-xl font-bold">{scenario.callerId}</h1>
        <p className="mt-1">{ENDED_BY_LABELS[result.endedBy]}</p>
        <p className="text-sm text-muted">
          {COPY.callLength} {formatClock(result.hangupT)}
        </p>
        {errorMessage && <p className="mt-2 text-sm text-danger">{errorMessage}</p>}
      </header>

      {leaked.length > 0 && (
        <section className="rounded-card bg-surface-raised p-3 text-sm">
          <p className="text-danger">{COPY.leaked}</p>
          <p>{leaked.map((r) => REDACTION_LABELS[r]).join(" ")}</p>
        </section>
      )}

      <TranscriptList turns={result.turns} className="flex-1" />

      <footer className="flex flex-col items-center gap-2">
        {saved ? (
          <Button variant="accept" onClick={onOpenXRay} className="w-full">
            {COPY.openXRay}
          </Button>
        ) : (
          <p className="text-xs text-muted">{COPY.notSaved}</p>
        )}
        <Button onClick={onRestart} className="w-full">
          {COPY.restart}
        </Button>
        <Button onClick={onBackToCampus} className="w-full">
          {COPY.backToCampus}
        </Button>
      </footer>
    </Screen>
  );
}
