"use client";

import { useEffect, useState } from "react";
import { Screen } from "@/components/ui/Screen";
import { COPY } from "@/lib/copy";
import type { Channel } from "@/lib/types";

// หน้ารอ AI วิเคราะห์ (~3–6 วิ): เส้นสแกนกวาดบทสนทนาจำลอง + ข้อความบอกขั้นตอนวนไป
const STEP_MS = 1400;
const BUBBLES = ["w-3/4", "ml-auto w-1/2", "w-2/3", "w-5/6", "ml-auto w-2/5", "w-3/5"];

export function XRayScanner({ channel }: { channel: Channel }) {
  const steps = COPY.xrayScanSteps(channel);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % steps.length), STEP_MS);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <div className="relative w-full max-w-xs overflow-hidden rounded-card bg-surface-raised p-4 ring-1 ring-xray/30">
        <div className="flex flex-col gap-3" aria-hidden>
          {BUBBLES.map((w, i) => (
            <div key={i} className={`h-6 rounded-full ${i % 2 ? "bg-player/20" : "bg-white/10"} ${w}`} />
          ))}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-xray/40 to-transparent motion-safe:animate-scan"
        />
      </div>
      <div>
        <p className="text-[11px] font-medium tracking-[0.2em] text-xray">{COPY.xrayKicker}</p>
        <p className="mt-2 text-muted" aria-live="polite">
          {steps[step]}
        </p>
      </div>
    </Screen>
  );
}
