"use client";

import { useSyncExternalStore } from "react";

// ความสามารถของเครื่อง — ใช้เลือกฉาก 3D หรือแผนที่ 2D (docs/GAME_SPEC.md ข้อ 9)

let webgl: boolean | null = null;
function detectWebGL(): boolean {
  if (webgl === null) {
    try {
      const canvas = document.createElement("canvas");
      webgl = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

const noop = () => () => {};

/** null = ยังไม่รู้ (ระหว่าง render ฝั่ง server) */
export function useWebGL(): boolean | null {
  return useSyncExternalStore(noop, detectWebGL, () => null);
}

const REDUCED = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}
