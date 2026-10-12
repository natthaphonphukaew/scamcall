"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { COPY, endMarkers, TACTIC_LABELS } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import type { TacticId } from "@/lib/types";
import type { PressureChartProps } from "./types";

// กราฟความกดดัน — ชุดข้อมูลเดียว (ไม่มี legend, หัวข้อบอกแล้ว) เส้น 2px + area wash ~10% + จุด r4 มีวงแหวนสีพื้น
// สีทั้งหมดอ้าง design token (var(--color-*)) — ข้อความใช้สีตัวอักษร ไม่ใช้สีของเส้น

interface Point {
  t: number;
  pressure: number;
  tactics: TacticId[];
}

function PressureTooltip({ active, payload }: TooltipContentProps) {
  const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
  if (!p) return null;
  return (
    <div className="rounded-card bg-surface px-3 py-2 text-xs shadow-lg ring-1 ring-surface-raised">
      <p className="text-muted">{formatClock(p.t)}</p>
      <p className="font-medium text-text">
        {COPY.pressureLabel} {p.pressure}/10
      </p>
      {p.tactics.length > 0 && <p className="text-muted">{p.tactics.map((t) => TACTIC_LABELS[t]).join(" · ")}</p>}
    </div>
  );
}

export function PressureChart({ play = false, turns, channel, shouldHangUpAt, hangupT }: PressureChartProps) {
  const markers = endMarkers(channel);
  const points: Point[] = turns
    .filter((t) => t.speaker === "scammer")
    .map((t) => ({ t: t.t, pressure: t.pressure, tactics: t.tactics }));
  if (points.length === 0) return null;

  const maxT = Math.max(hangupT ?? 0, ...points.map((p) => p.t));

  return (
    <figure className="rounded-card bg-surface-raised p-4">
      <figcaption className="mb-2">
        <p className="font-bold">{COPY.pressureTitle}</p>
        <p className="text-xs text-muted">{COPY.pressureCaption}</p>
      </figcaption>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 20, right: 12, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--color-surface)" strokeWidth={1} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, Math.ceil(maxT)]}
              tickFormatter={formatClock}
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 5, 10]}
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={PressureTooltip}
              cursor={{ stroke: "var(--color-muted)", strokeWidth: 1 }}
            />
            <ReferenceLine
              x={shouldHangUpAt}
              stroke="var(--color-danger)"
              strokeWidth={2}
              label={{ value: markers.should, position: "insideTopLeft", fill: "var(--color-text)", fontSize: 11 }}
            />
            {hangupT !== null && (
              <ReferenceLine
                x={hangupT}
                stroke="var(--color-player)"
                strokeWidth={2}
                label={{ value: markers.you, position: "insideBottomRight", fill: "var(--color-text)", fontSize: 11 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="pressure"
              stroke="var(--color-scammer)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="var(--color-scammer)"
              fillOpacity={0.1}
              dot={{ r: 4, fill: "var(--color-scammer)", stroke: "var(--color-surface-raised)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "var(--color-scammer)", stroke: "var(--color-surface-raised)", strokeWidth: 2 }}
              isAnimationActive={play}
              animationDuration={1400}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
