"use client";

import { AnimatePresence, motion } from "motion/react";
import { Confetti, seedFrom } from "@/components/xray/Confetti";
import { COPY } from "@/lib/copy";
import type { LevelInfo } from "@/lib/game/progression";

/** ป๊อปอัปเลเวลอัป — แตะที่ไหนก็ปิด */
export function LevelUpPopup({ level, open, onClose }: { level: LevelInfo; open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label={COPY.levelUp}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Confetti seed={seedFrom(`lv${level.level}`)} count={40} />
          <motion.div
            initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
            className="w-full max-w-xs rounded-3xl bg-surface-raised p-6 text-center shadow-2xl ring-2 ring-gold"
          >
            <p className="text-sm font-bold tracking-[0.25em] text-gold">LEVEL UP!</p>
            <p className="mt-2 text-6xl font-bold">Lv.{level.level}</p>
            <p className="mt-1 text-lg">{level.title}</p>
            <p className="mt-4 text-xs text-muted">{COPY.tapToClose}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
