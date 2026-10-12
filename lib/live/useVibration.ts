"use client";

import { useEffect } from "react";

// สั่นแบบสายเรียกเข้า (Android — iPhone/Safari ไม่รองรับ Vibration API จะเงียบไปเอง)
const RING_PATTERN = [400, 250, 400];
const REPEAT_MS = 2200;

/** สั่นเป็นจังหวะเมื่อ active และหยุดทันทีเมื่อ false หรือ unmount */
export function useRingVibration(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    const buzz = () => navigator.vibrate(RING_PATTERN);
    buzz();
    const id = window.setInterval(buzz, REPEAT_MS);
    return () => {
      window.clearInterval(id);
      navigator.vibrate(0);
    };
  }, [active]);
}
