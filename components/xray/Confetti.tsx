"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { seededRandom } from "@/lib/campus/geometry";

// confetti ตอนได้ "ภูมิคุ้มกันแกร่ง" — DOM ล้วน ไม่ต้องใช้ library · สุ่มแบบ seed คงที่ (render ซ้ำได้ผลเดิม)

const COLORS = [
  "var(--color-accept)",
  "var(--color-xray)",
  "var(--color-player)",
  "var(--color-scammer)",
  "var(--color-text)",
];
const DURATION = 1.9;

export function Confetti({ seed, count = 56 }: { seed: number; count?: number }) {
  const pieces = useMemo(() => {
    const rand = seededRandom(seed);
    return Array.from({ length: count }, (_, i) => ({
      x: (rand() - 0.5) * 560,
      peak: -(160 + rand() * 260),
      fall: 420 + rand() * 320,
      rotate: (rand() - 0.5) * 900,
      delay: rand() * 0.18,
      w: 6 + rand() * 6,
      h: 9 + rand() * 9,
      color: COLORS[i % COLORS.length],
      round: rand() > 0.7,
    }));
  }, [seed, count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/3"
          style={{ width: p.w, height: p.h, background: p.color, borderRadius: p.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.peak, p.fall], opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{
            delay: p.delay,
            x: { duration: DURATION, ease: "easeOut" },
            y: { duration: DURATION, times: [0, 0.35, 1], ease: ["easeOut", "easeIn"] },
            opacity: { duration: DURATION, times: [0, 0.75, 1] },
            rotate: { duration: DURATION, ease: "linear" },
          }}
        />
      ))}
    </div>
  );
}

/** seed จาก sessionId — สายเดิมได้ confetti ลายเดิม */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
