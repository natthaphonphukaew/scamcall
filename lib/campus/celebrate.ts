// ฉลองเพื่อนที่เพิ่งช่วยสำเร็จ — จำในเครื่องว่าฉลองด่านไหนไปแล้ว (กลับมาแคมปัสครั้งถัดไปจะไม่ฉลองซ้ำ)

const KEY = "scamcall:celebrated";

/** ด่านที่ช่วยสำเร็จแล้วแต่ยังไม่เคยฉลอง */
export function newlySaved(savedLevelIds: readonly string[], celebrated: readonly string[]): string[] {
  const done = new Set(celebrated);
  return savedLevelIds.filter((id) => !done.has(id));
}

export function readCelebrated(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeCelebrated(levelIds: readonly string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(levelIds)]));
  } catch {
    // private mode — ฉลองซ้ำได้ ไม่เป็นไร
  }
}
