"use client";

import { motion, useReducedMotion } from "motion/react";
import { PhoneIcon } from "@/components/ui/PhoneIcon";
import { TranscriptList } from "@/components/ui/TranscriptList";
import { COPY } from "@/lib/copy";
import { formatClock, initialOf } from "@/lib/format";
import type { InCallScreenProps } from "./types";

// หน้าระหว่างโทร (Phase 4A): วงเสียงเต้นตอนคนร้ายพูด + transcript สด + ปุ่มวางสายใหญ่เห็นชัดตลอด
// อนิเมชันเป็น transform อย่างเดียว (เบาเครื่อง — มือถือต้องเหลือแรงให้ไมค์ + AI)

function VoiceOrb({ name, speaking }: { name: string; speaking: boolean }) {
  const still = useReducedMotion();
  return (
    <div className="relative flex size-32 items-center justify-center">
      <motion.span
        aria-hidden
        className={`absolute inset-0 rounded-full ${speaking ? "bg-scammer/30" : "bg-player/15"}`}
        animate={still ? undefined : { scale: speaking ? [1, 1.25, 1.05, 1.2, 1] : [1, 1.06, 1] }}
        transition={{ duration: speaking ? 1.1 : 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        className={`relative flex size-24 items-center justify-center rounded-full text-4xl font-bold shadow-2xl ring-2 transition-colors ${
          speaking ? "bg-scammer/25 ring-scammer" : "bg-white/10 ring-white/15"
        }`}
      >
        {initialOf(name)}
      </span>
    </div>
  );
}

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
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col items-center bg-call px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted">{COPY.simulationBadge}</span>

      <header className="mt-7 flex flex-col items-center gap-2 text-center">
        <VoiceOrb name={scenario.callerId} speaking={phase === "in_call" && isScammerSpeaking} />
        <h1 className="mt-1 text-balance text-2xl font-bold">{scenario.callerId}</h1>
        <p className="font-mono text-xl tabular-nums text-muted">{formatClock(elapsed)}</p>
        <p
          className={`text-sm ${isScammerSpeaking ? "text-scammer" : "text-muted"} ${phase === "connecting" ? "motion-safe:animate-pulse" : ""}`}
          aria-live="polite"
        >
          {status}
        </p>
        {remaining !== null && phase === "in_call" && (
          <p className="text-xs text-muted/80">
            {COPY.autoHangUpIn} {formatClock(remaining)}
          </p>
        )}
      </header>

      <TranscriptList
        turns={turns}
        className="mt-4 w-full flex-1 text-sm [mask-image:linear-gradient(to_bottom,transparent,black_12%)] [scrollbar-width:none]"
      />

      <footer className="mt-3 flex flex-col items-center gap-3">
        <p className="text-xs text-muted">{COPY.safeWordHint}</p>
        <button type="button" onClick={onHangUp} className="flex flex-col items-center gap-1 text-sm text-muted">
          <span className="flex size-20 items-center justify-center rounded-full bg-danger text-white shadow-lg shadow-danger/40 transition active:scale-95">
            <PhoneIcon className="size-9" hangUp />
          </span>
          {COPY.hangUp}
        </button>
      </footer>
    </main>
  );
}
