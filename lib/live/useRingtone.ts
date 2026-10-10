"use client";

import { useEffect } from "react";
import { Ringtone } from "./ringtone";

/** ดังเมื่อ active เป็น true และหยุดทันทีเมื่อ false หรือ unmount */
export function useRingtone(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const ringtone = new Ringtone();
    ringtone.start();
    return () => ringtone.stop();
  }, [active]);
}
