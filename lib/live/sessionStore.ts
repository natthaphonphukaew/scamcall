import { useSyncExternalStore } from "react";
import type { AnalyzeResponse, CallSession } from "@/lib/types";

// เก็บผลสาย + ผลวิเคราะห์ใน sessionStorage (หายเมื่อปิดแท็บ) — ดู docs/SPEC.md ข้อ 4
// เขียนเฉพาะเมื่อผู้เล่นยินยอม (LiveCallController เช็กก่อนเรียก saveCallSession)

const sessionKey = (id: string) => `scamcall:session:${id}`;
const analysisKey = (id: string) => `scamcall:analysis:${id}`;
const CHANGE_EVENT = "scamcall:session-store-change";
const SERVER = "__server__";

function write(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / storage เต็ม — ไม่เป็นไร
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function readRaw(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveCallSession(session: CallSession): void {
  write(sessionKey(session.sessionId), session);
}

export function loadCallSession(sessionId: string): CallSession | null {
  return parse(readRaw(sessionKey(sessionId)));
}

/** cache ผลวิเคราะห์ — refresh หน้า X-Ray แล้วไม่ต้องเรียก AI ซ้ำ (ประหยัดโควตา) */
export function saveAnalysis(sessionId: string, response: AnalyzeResponse): void {
  write(analysisKey(sessionId), response);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function useStoredItem<T>(key: string): { ready: boolean; value: T | null } {
  // snapshot เป็น string (เทียบค่าได้) แล้วค่อย parse — กัน re-render วนไม่จบ
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => SERVER);
  return raw === SERVER ? { ready: false, value: null } : { ready: true, value: parse<T>(raw) };
}

export function useStoredCall(sessionId: string) {
  const session = useStoredItem<CallSession>(sessionKey(sessionId));
  const analysis = useStoredItem<AnalyzeResponse>(analysisKey(sessionId));
  return { ready: session.ready, session: session.value, analysis: analysis.value };
}
