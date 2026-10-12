"use client";

import { AnimatePresence, motion } from "motion/react";
import { Confetti, seedFrom } from "@/components/xray/Confetti";
import { PhoneIcon } from "@/components/ui/PhoneIcon";
import { COPY } from "@/lib/copy";
import type { Channel } from "@/lib/types";

// ฉากซ้อนบนแผนที่ (Phase 4C): ฉลองเพื่อนที่เพิ่งช่วยสำเร็จ + ฉากสวมบทก่อนเข้าสาย/แชท

export function CelebrationToast({ names }: { names: string[] | null }) {
  return (
    <AnimatePresence>
      {names && names.length > 0 && (
        <>
          <Confetti seed={seedFrom(names.join())} count={44} />
          <motion.div
            role="status"
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            className="pointer-events-none absolute inset-x-4 top-24 z-30 mx-auto w-fit max-w-sm rounded-2xl bg-accept px-4 py-3 text-center font-bold text-white shadow-2xl"
          >
            ✨ {COPY.celebrateSaved(names.join(", "))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** ฉากสวมบท: จอมืดลง + มือถือลอยขึ้น ก่อนเปลี่ยนไปหน้าสาย/แชท */
export function LaunchOverlay({ launch }: { launch: { name: string; channel: Channel } | null }) {
  return (
    <AnimatePresence>
      {launch && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-call text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <motion.span
            initial={{ y: 120, scale: 0.5, rotate: -12 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
            className="flex size-24 items-center justify-center rounded-3xl bg-white/10 text-5xl ring-1 ring-white/20"
          >
            {launch.channel === "chat" ? "💬" : <PhoneIcon className="size-12" />}
          </motion.span>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-lg">
            {COPY.launchAs(launch.name)}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
