"use client";

import { useSyncExternalStore } from "react";

// ความยินยอมของผู้เล่น (CLAUDE.md ข้อ 7.3, 7.5 · docs/SPEC.md ข้อ 4)
// เก็บใน localStorage ของเครื่องผู้เล่นเท่านั้น — ไม่ส่งไป server

export interface Consent {
  /** เข้าใจว่าเป็นการจำลอง + เสียงถูกส่งไปประมวลผลที่ Google — ต้องเป็น true ถึงจะรับสายได้ */
  acknowledged: true;
  /** ยืนยันว่าอายุ 18 ปีขึ้นไป (เงื่อนไข Gemini API) — ต้องเป็น true */
  adult: true;
  /** ยินยอมให้เก็บ transcript (ที่ซ่อนข้อมูลแล้ว) ไว้ทำ Scam X-Ray */
  saveTranscript: boolean;
}

// v2 (2026-10-11): เพิ่มข้อแจ้งเรื่อง Gemini free tier + อายุ 18+
// v3 (2026-10-11): เพิ่มข้อแจ้งเรื่องฉายา/คะแนนบนบอร์ดเกม → ทุกคนต้องยินยอมใหม่
const KEY = "scamcall:consent:v3";
const CHANGE_EVENT = "scamcall:consent-change";
const SERVER = "__server__";

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Consent | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Consent>;
    return v.acknowledged === true && v.adult === true
      ? { acknowledged: true, adult: true, saveTranscript: v.saveTranscript === true }
      : null;
  } catch {
    return null;
  }
}

export function readConsent(): Consent | null {
  return parse(readRaw());
}

export function writeConsent(consent: Consent): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(consent));
  } catch {
    // storage ใช้ไม่ได้ (private mode) — ยังเล่นได้ในหน้านี้ แต่ต้องยอมรับใหม่ทุกครั้ง
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** ready = false ระหว่าง render ฝั่ง server / ก่อน hydrate (ยังไม่รู้ค่า) */
export function useConsent(): { ready: boolean; consent: Consent | null } {
  const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
  return raw === SERVER ? { ready: false, consent: null } : { ready: true, consent: parse(raw) };
}
