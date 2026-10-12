"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { PhoneIcon } from "@/components/ui/PhoneIcon";
import { COPY } from "@/lib/copy";

// ปัดเพื่อรับสาย (เหมือนหน้าจอล็อกของมือถือ) — ลากเกิน 75% = รับสาย, ปล่อยก่อน = เด้งกลับ
// แตะเฉยๆ = กระตุกบอกใบ้ · กด Enter/Space บนคีย์บอร์ด = รับสายทันที (เข้าถึงได้โดยไม่ต้องลาก)

const PAD = 4;
const ANSWER_AT = 0.75;

export function SlideToAnswer({ onAnswer }: { onAnswer: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLButtonElement>(null);
  const dragged = useRef(false);
  const done = useRef(false);
  const [max, setMax] = useState(0);
  const [hint, setHint] = useState(0);
  const x = useMotionValue(0);
  const labelOpacity = useTransform(x, [0, Math.max(1, max * 0.6)], [1, 0]);

  useLayoutEffect(() => {
    const t = track.current;
    const b = thumb.current;
    if (!t || !b) return;
    const measure = () => setMax(Math.max(0, t.clientWidth - b.offsetWidth - PAD * 2));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    return () => ro.disconnect();
  }, []);

  const answer = () => {
    if (done.current) return;
    done.current = true;
    void animate(x, max, { duration: 0.15 });
    onAnswer();
  };

  const onDragEnd = () => {
    if (x.get() >= max * ANSWER_AT) answer();
    else void animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
  };

  const onClick = (e: MouseEvent) => {
    if (dragged.current) return;
    // detail = 0 → กดจากคีย์บอร์ด (Enter/Space) → รับสายเลย · แตะ/คลิก → บอกใบ้ให้ปัด
    if (e.detail === 0) answer();
    else setHint((n) => n + 1);
  };

  return (
    <div ref={track} className="relative h-16 w-full rounded-full bg-white/10 ring-1 ring-white/10 backdrop-blur" style={{ padding: PAD }}>
      <motion.span
        style={{ opacity: labelOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-lg font-medium text-shimmer motion-safe:animate-shimmer"
      >
        {hint > 0 ? COPY.slideHint : COPY.slideToAnswer}
      </motion.span>
      <motion.button
        ref={thumb}
        key={hint}
        type="button"
        aria-label={COPY.answer}
        drag="x"
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.04}
        dragMomentum={false}
        style={{ x }}
        onPointerDown={() => (dragged.current = false)}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`relative z-10 flex size-14 touch-none items-center justify-center rounded-full bg-accept text-white shadow-lg shadow-accept/40 ${hint > 0 ? "motion-safe:animate-nudge" : ""}`}
      >
        <PhoneIcon />
      </motion.button>
    </div>
  );
}
