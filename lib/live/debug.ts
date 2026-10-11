// โหมด debug ของสาย — เปิดด้วย ?debug=1 (จำไว้ในเครื่อง) ปิดด้วย ?debug=0
// log ทุก event การถอดเสียงออก console ของเครื่องผู้เล่นเท่านั้น (ไม่ส่งไปไหน) ใช้ไล่ปัญหาข้อความหาย

const KEY = "scamcall:debug";

export function isLiveDebug(): boolean {
  try {
    const flag = new URLSearchParams(window.location.search).get("debug");
    if (flag === "1") localStorage.setItem(KEY, "1");
    if (flag === "0") localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function liveDebugLog(enabled: boolean, t: number, event: string, detail?: Record<string, unknown>): void {
  if (!enabled) return;
  console.info(`[live ${t.toFixed(1)}s] ${event}`, detail ?? "");
}
