"use client";

import { useSyncExternalStore } from "react";

// โหมดทดสอบกับเพื่อน — Nut เปิดที่ /playtest ก่อนส่งเครื่องให้เพื่อน
// เก็บใน localStorage ของเครื่องนั้น: รหัสผู้ทดสอบ (ไม่ใช่ชื่อจริง) + รอบ

export interface PlaytestMode {
  testerCode: string;
  round: number;
}

const KEY = "scamcall:playtest:v1";
const CHANGE_EVENT = "scamcall:playtest-change";
const SERVER = "__server__";

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): PlaytestMode | null {
  if (!raw || raw === SERVER) return null;
  try {
    const v = JSON.parse(raw) as Partial<PlaytestMode>;
    return typeof v.testerCode === "string" && typeof v.round === "number"
      ? { testerCode: v.testerCode, round: v.round }
      : null;
  } catch {
    return null;
  }
}

export function setPlaytestMode(mode: PlaytestMode | null): void {
  try {
    if (mode) localStorage.setItem(KEY, JSON.stringify(mode));
    else localStorage.removeItem(KEY);
  } catch {
    // storage ใช้ไม่ได้ — โหมดทดสอบจะไม่ถูกจำ
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

export function usePlaytestMode(): { ready: boolean; mode: PlaytestMode | null } {
  const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
  return { ready: raw !== SERVER, mode: parse(raw) };
}
