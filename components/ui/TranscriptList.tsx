"use client";

import { useEffect, useRef } from "react";
import { COPY, SPEAKER_LABELS } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import type { TranscriptTurn } from "@/lib/types";

/** รายการบทสนทนา เลื่อนลงล่างสุดอัตโนมัติเมื่อมีข้อความใหม่ */
export function TranscriptList({ turns, className = "" }: { turns: TranscriptTurn[]; className?: string }) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastText = turns.at(-1)?.text;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length, lastText]);

  if (turns.length === 0) {
    return <p className={`py-8 text-center text-sm text-muted ${className}`}>{COPY.transcriptEmpty}</p>;
  }

  return (
    <ol className={`flex flex-col gap-3 overflow-y-auto ${className}`}>
      {turns.map((turn) => (
        <li
          key={turn.id}
          className={`max-w-[85%] rounded-card bg-surface-raised px-4 py-2 ${
            turn.speaker === "player" ? "self-end" : "self-start"
          } ${turn.pending ? "opacity-60" : ""}`}
        >
          <div className={`text-xs ${turn.speaker === "scammer" ? "text-scammer" : "text-player"}`}>
            {SPEAKER_LABELS[turn.speaker]} · {turn.pending ? COPY.speakingNow : formatClock(turn.t)}
          </div>
          <p className="leading-relaxed">{turn.text}</p>
        </li>
      ))}
      <div ref={endRef} />
    </ol>
  );
}
