import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { TranscriptList } from "@/components/ui/TranscriptList";
import { CHAT_ENDED_BY_LABELS, COPY } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import { REDACTION_LABELS } from "@/lib/privacy/mask";
import type { ChatEndedScreenProps } from "./types";

// สรุปหลังบล็อก/แชทจบ — ไปต่อที่ Scam X-Ray (เหมือน EndedScreen ของสายโทร)
export function ChatEndedScreen({
  contact,
  result,
  saved,
  onOpenXRay,
  onRestart,
  onBackToCampus,
}: ChatEndedScreenProps) {
  const leaked = [...new Set(result.turns.filter((t) => t.speaker === "player").flatMap((t) => t.redactions))];

  return (
    <Screen className="gap-4">
      <header className="text-center">
        <p className="text-muted">{COPY.chatEnded}</p>
        <h1 className="text-xl font-bold">{contact}</h1>
        <p className="mt-1">{CHAT_ENDED_BY_LABELS[result.endedBy]}</p>
        <p className="text-sm text-muted">
          {COPY.chatLength} {formatClock(result.hangupT)}
        </p>
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
          {COPY.chatRestart}
        </Button>
        <Button onClick={onBackToCampus} className="w-full">
          {COPY.backToCampus}
        </Button>
      </footer>
    </Screen>
  );
}
