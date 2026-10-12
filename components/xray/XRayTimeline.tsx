import { Fragment } from "react";
import { COPY, endMarkers, SPEAKER_LABELS, TACTIC_LABELS } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import type { XRayTimelineProps } from "./types";

// ไทม์ไลน์: เรียงตามลำดับประโยค (ไม่ใช่ตามเวลา — เวลาของผู้เล่นมักเท่ากับประโยคถัดไป ดู week1-findings)
// ทำหน้าที่เป็น "table view" ของกราฟด้วย: ทุกประโยคคนร้ายมีค่าความกดดันเป็นตัวเลข

export function XRayTimeline({ turns, channel, shouldHangUpAt, hangupT }: XRayTimelineProps) {
  const markers = endMarkers(channel);
  const markerIndex = turns.findIndex((t) => t.speaker === "scammer" && t.t === shouldHangUpAt);

  return (
    <section>
      <h2 className="mb-2 font-bold">{COPY.timelineTitle}</h2>
      <ol className="flex flex-col gap-3">
        {turns.map((turn, i) => (
          <Fragment key={i}>
            {i === markerIndex && (
              <li className="flex items-center gap-2 text-sm font-bold text-danger" aria-label={markers.should}>
                <span className="h-0.5 flex-1 bg-danger" />
                {markers.should} · {formatClock(shouldHangUpAt)}
                <span className="h-0.5 flex-1 bg-danger" />
              </li>
            )}
            <li
              className={`max-w-[90%] rounded-card bg-surface-raised px-4 py-2 ${
                turn.speaker === "player" ? "self-end" : "self-start"
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className={turn.speaker === "scammer" ? "text-scammer" : "text-player"}>
                  {SPEAKER_LABELS[turn.speaker]} · {formatClock(turn.t)}
                </span>
                {turn.speaker === "scammer" && (
                  <span className="tabular-nums text-muted">
                    {COPY.pressureLabel} {turn.pressure}/10
                  </span>
                )}
              </div>
              <p className="leading-relaxed">{turn.text}</p>
              {turn.tactics.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1">
                  {turn.tactics.map((tactic) => (
                    <li key={tactic} className="rounded-full bg-surface px-2 py-0.5 text-xs text-text">
                      {TACTIC_LABELS[tactic]}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </Fragment>
        ))}
        {hangupT !== null && (
          <li className="flex items-center gap-2 text-sm font-bold text-player">
            <span className="h-0.5 flex-1 bg-player" />
            {markers.you} · {formatClock(hangupT)}
            <span className="h-0.5 flex-1 bg-player" />
          </li>
        )}
      </ol>
    </section>
  );
}
