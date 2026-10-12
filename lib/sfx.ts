"use client";

import { useSyncExternalStore } from "react";

// เสียงประกอบเกม (Phase 4C) — สังเคราะห์ด้วย Web Audio ไม่ต้องโหลดไฟล์เสียง
// เปิดเป็นค่าเริ่มต้น ปิดได้ (จำไว้ใน localStorage ของเครื่อง) · ห้ามเล่นในหน้าสายโทร (ไม่ให้ทับเสียง AI)
// browser ยอมให้ส่งเสียงหลังผู้ใช้แตะหน้าเว็บแล้วเท่านั้น — ถ้ายังไม่แตะ เสียงจะเงียบไปเอง

export type Sfx = "pop" | "success" | "close" | "fail" | "levelUp" | "badge" | "message" | "xp";

const MUTE_KEY = "scamcall:sfx-muted";
const CHANGE_EVENT = "scamcall:sfx-change";

let ctx: AudioContext | null = null;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // private mode — ใช้ได้แค่รอบนี้
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** สถานะปิดเสียง (server = ยังไม่รู้ → ถือว่าเปิด) */
export function useSfxMuted(): boolean {
  return useSyncExternalStore(subscribe, readMuted, () => false);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Tone {
  freq: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

function tone(c: AudioContext, t0: number, { freq, at, dur, type = "sine", gain = 0.12, slideTo }: Tone): void {
  const start = t0 + at;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

const arpeggio = (notes: number[], step: number, dur: number, type: OscillatorType = "triangle"): Tone[] =>
  notes.map((freq, i) => ({ freq, at: i * step, dur, type }));

// ความถี่โน้ต (Hz)
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568, C7 = 2093;

const SOUNDS: Record<Sfx, Tone[]> = {
  pop: [{ freq: 620, slideTo: 980, at: 0, dur: 0.09, type: "triangle", gain: 0.1 }],
  message: [
    { freq: 880, at: 0, dur: 0.07, gain: 0.08 },
    { freq: 1320, at: 0.08, dur: 0.1, gain: 0.08 },
  ],
  xp: [{ freq: 990, slideTo: 1480, at: 0, dur: 0.12, type: "sine", gain: 0.07 }],
  success: arpeggio([C5, E5, G5, C6], 0.085, 0.22),
  close: arpeggio([C5, E5], 0.12, 0.25, "sine"),
  fail: [
    { freq: 220, slideTo: 92, at: 0, dur: 0.5, type: "sawtooth", gain: 0.08 },
    { freq: 233, slideTo: 98, at: 0, dur: 0.5, type: "square", gain: 0.04 },
  ],
  levelUp: [...arpeggio([G5, C6, E6, G6], 0.09, 0.2), { freq: C7, at: 0.38, dur: 0.5, type: "triangle", gain: 0.1 }],
  badge: arpeggio([G6, C7, E6 * 2], 0.06, 0.16, "sine"),
};

export function playSfx(name: Sfx): void {
  if (readMuted()) return;
  const c = audio();
  if (!c) return;
  try {
    const t0 = c.currentTime + 0.01;
    for (const t of SOUNDS[name]) tone(c, t0, t);
  } catch {
    // อุปกรณ์ไม่รองรับบางอย่าง — เงียบไว้ ไม่กระทบเกม
  }
}
