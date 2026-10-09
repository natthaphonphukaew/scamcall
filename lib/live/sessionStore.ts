import type { CallSession } from "@/lib/types";

// เก็บผลสายใน sessionStorage (หายเมื่อปิดแท็บ) — ดู docs/SPEC.md ข้อ 4
const key = (sessionId: string) => `scamcall:session:${sessionId}`;

export function saveCallSession(session: CallSession): void {
  try {
    sessionStorage.setItem(key(session.sessionId), JSON.stringify(session));
  } catch {
    // private mode / storage เต็ม — ไม่เป็นไร สายยังจบได้ปกติ
  }
}

export function loadCallSession(sessionId: string): CallSession | null {
  try {
    const raw = sessionStorage.getItem(key(sessionId));
    return raw ? (JSON.parse(raw) as CallSession) : null;
  } catch {
    return null;
  }
}
