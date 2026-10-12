"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { LevelInfo } from "@/lib/game/progression";

const pctOf = (l: LevelInfo) => Math.min(100, (l.xpIntoLevel / l.xpForLevel) * 100);

/**
 * แถบ XP ของเลเวลปัจจุบัน — ถ้าส่ง `from` มา แถบจะวิ่งจากค่าเดิมไปค่าใหม่ (Phase 4C)
 * เลเวลอัป: วิ่งจนเต็ม → เรียก onLevelUp → เริ่มเลเวลใหม่จาก 0
 */
export function XpBar({ level, from, onLevelUp }: { level: LevelInfo; from?: LevelInfo; onLevelUp?: () => void }) {
  const levelsUp = from ? level.level > from.level : false;
  const [phase, setPhase] = useState<"before" | "after">(from && levelsUp ? "before" : "after");
  const shown = phase === "before" && from ? from : level;
  const width = useMotionValue(from ? pctOf(from) : pctOf(level));
  const widthCss = useTransform(width, (v) => `${v}%`);
  // เก็บ callback ใน ref — parent ส่งฟังก์ชันใหม่ทุก render ได้ โดยแถบไม่เริ่มวิ่งใหม่
  const onLevelUpRef = useRef(onLevelUp);
  useEffect(() => {
    onLevelUpRef.current = onLevelUp;
  });

  useEffect(() => {
    if (!from) {
      width.set(pctOf(level));
      return;
    }
    if (phase === "before") {
      const c = animate(width, 100, { duration: 0.8, delay: 0.5, ease: "easeIn" });
      void c.then(() => {
        onLevelUpRef.current?.();
        width.set(0);
        setPhase("after");
      });
      return () => c.stop();
    }
    const c = animate(width, pctOf(level), { duration: 0.9, delay: levelsUp ? 0.2 : 0.5, ease: "easeOut" });
    return () => c.stop();
  }, [from, level, phase, levelsUp, width]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <p className="font-bold">
          Lv.{shown.level} · {shown.title}
        </p>
        <p className="text-xs tabular-nums text-muted">
          {shown.xpIntoLevel}/{shown.xpForLevel} XP
        </p>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={level.xpForLevel}
        aria-valuenow={level.xpIntoLevel}
      >
        <motion.div className="h-full rounded-full bg-gradient-to-r from-accept to-gold" style={{ width: widthCss }} />
      </div>
    </div>
  );
}
