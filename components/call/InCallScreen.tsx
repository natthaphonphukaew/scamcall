import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { TranscriptList } from "@/components/ui/TranscriptList";
import { COPY } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import type { InCallScreenProps } from "./types";

// Week 1: โครงเรียบ — Week 2 ทำหน้าจอระหว่างโทรให้เหมือนจริง
export function InCallScreen({
  scenario,
  phase,
  elapsed,
  remaining,
  turns,
  isScammerSpeaking,
  onHangUp,
}: InCallScreenProps) {
  const status =
    phase === "connecting" ? COPY.connecting : isScammerSpeaking ? COPY.scammerSpeaking : COPY.listening;

  return (
    <Screen className="gap-4">
      <header className="text-center">
        <h1 className="text-xl font-bold">{scenario.callerId}</h1>
        <p className="font-mono text-2xl tabular-nums">{formatClock(elapsed)}</p>
        <p className={`text-sm ${isScammerSpeaking ? "text-scammer" : "text-muted"}`} aria-live="polite">
          {status}
        </p>
        {remaining !== null && phase === "in_call" && (
          <p className="text-xs text-muted">
            {COPY.autoHangUpIn} {formatClock(remaining)}
          </p>
        )}
      </header>

      <TranscriptList turns={turns} className="flex-1" />

      <footer className="flex flex-col items-center gap-3">
        <p className="text-xs text-muted">{COPY.safeWordHint}</p>
        <Button variant="danger" round onClick={onHangUp}>
          {COPY.hangUp}
        </Button>
      </footer>
    </Screen>
  );
}
