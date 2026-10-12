"use client";

import { COPY } from "@/lib/copy";
import { playSfx, setSfxMuted, useSfxMuted } from "@/lib/sfx";

/** ปุ่มเปิด/ปิดเสียงประกอบ (ไม่เกี่ยวกับเสียงสายโทร) */
export function SoundToggle({ className = "" }: { className?: string }) {
  const muted = useSfxMuted();
  return (
    <button
      type="button"
      onClick={() => {
        setSfxMuted(!muted);
        if (muted) playSfx("pop");
      }}
      aria-label={muted ? COPY.soundOn : COPY.soundOff}
      aria-pressed={!muted}
      className={`rounded-full bg-black/40 px-3 py-1 text-sm backdrop-blur ${className}`}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
