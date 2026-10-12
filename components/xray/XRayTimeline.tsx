"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { COPY, endMarkers, SPEAKER_LABELS, TACTIC_LABELS } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import type { XRayTimelineProps } from "./types";

// ไทม์ไลน์: เรียงตามลำดับประโยค (ไม่ใช่ตามเวลา — เวลาของผู้เล่นมักเท่ากับประโยคถัดไป ดู week1-findings)
// ทำหน้าที่เป็น "table view" ของกราฟด้วย: ทุกประโยคคนร้ายมีค่าความกดดันเป็นตัวเลข

// ตอนเปิดผล: ประโยคทยอยขึ้นทีละอัน (เพดาน ~1.5 วิ ไม่ให้รอนาน) และป้ายเทคนิคเด้งตามหลัง
const STEP_S = 0.07;
const MAX_DELAY_S = 1.5;

export function XRayTimeline({ play = false, turns, channel, shouldHangUpAt, hangupT }: XRayTimelineProps) {
  const markers = endMarkers(channel);
  const delayOf = (i: number) => Math.min(MAX_DELAY_S, 0.3 + i * STEP_S);
  const enter = (i: number) =>
    play
      ? {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: delayOf(i), duration: 0.3 },
        }
      : {};
  const markerIndex = turns.findIndex((t) => t.speaker === "scammer" && t.t === shouldHangUpAt);

  return (
    <section>
      <h2 className="mb-2 font-bold">{COPY.timelineTitle}</h2>
      <ol className="flex flex-col gap-3">
        {turns.map((turn, i) => (
          <Fragment key={i}>
            {i === markerIndex && (
              <motion.li
                {...enter(i)}
                className="flex items-center gap-2 text-sm font-bold text-danger"
                aria-label={markers.should}
              >
                <span className="h-0.5 flex-1 bg-danger" />
                {markers.should} · {formatClock(shouldHangUpAt)}
                <span className="h-0.5 flex-1 bg-danger" />
              </motion.li>
            )}
            <motion.li
              {...enter(i)}
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
                  {turn.tactics.map((tactic, j) => (
                    <motion.li
                      key={tactic}
                      {...(play
                        ? {
                            initial: { scale: 0, opacity: 0 },
                            animate: { scale: 1, opacity: 1 },
                            transition: {
                              type: "spring",
                              stiffness: 500,
                              damping: 16,
                              delay: delayOf(i) + 0.2 + j * 0.08,
                            },
                          }
                        : {})}
                      className="rounded-full bg-xray/15 px-2 py-0.5 text-xs text-xray ring-1 ring-xray/30"
                    >
                      {TACTIC_LABELS[tactic]}
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.li>
          </Fragment>
        ))}
        {hangupT !== null && (
          <motion.li {...enter(turns.length)} className="flex items-center gap-2 text-sm font-bold text-player">
            <span className="h-0.5 flex-1 bg-player" />
            {markers.you} · {formatClock(hangupT)}
            <span className="h-0.5 flex-1 bg-player" />
          </motion.li>
        )}
      </ol>
    </section>
  );
}
