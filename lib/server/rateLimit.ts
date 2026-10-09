/**
 * Rate limit แบบ fixed window ในหน่วยความจำ — พอสำหรับ dev/เดโม
 * บน Vercel แต่ละ instance นับแยกกัน (ยอมรับได้ ดู docs/SPEC.md ข้อ 3.1)
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function take(key: string): boolean {
    const t = now();
    const entry = hits.get(key);
    if (!entry || t >= entry.resetAt) {
      // ล้าง key ที่หมดอายุไปด้วย กัน Map โตไม่รู้จบ
      for (const [k, v] of hits) if (t >= v.resetAt) hits.delete(k);
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count += 1;
    return true;
  };
}
