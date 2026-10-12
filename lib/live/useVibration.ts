"use client";

import { useEffect } from "react";

// สั่นแบบสายเรียกเข้า (Android — iPhone/Safari ไม่รองรับ Vibration API จะเงียบไปเอง)
const RING_PATTERN = [400, 250, 400];
const REPEAT_MS = 2200;

/** สั่นเป็นจังหวะเมื่อ active และหยุดทันทีเมื่อ false หรือ unmount */
export function useRingVibration(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    // browser ยอมให้สั่นเฉพาะหลังผู้ใช้แตะหน้าเว็บแล้ว (เปิดลิงก์สายตรงๆ = ยังไม่แตะ → ข้าม ไม่ให้ console เต็ม error)
    const buzz = () => {
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      navigator.vibrate(RING_PATTERN);
    };
    buzz();
    const id = window.setInterval(buzz, REPEAT_MS);
    return () => {
      window.clearInterval(id);
      navigator.vibrate(0);
    };
  }, [active]);
}
