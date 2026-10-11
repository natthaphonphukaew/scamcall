import type { Pt } from "./data";

// เรขาคณิต 2D บนพื้นแคมปัส (เมตร) — pure function ใช้ทั้งฉาก 3D และแผนที่ 2D

export function centroid(pts: Pt[]): Pt {
  return pts.reduce<Pt>((c, p) => [c[0] + p[0] / pts.length, c[1] + p[1] / pts.length], [0, 0]);
}

export function pointInPolygon([x, z]: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function bounds(pts: Pt[]) {
  const xs = pts.map((p) => p[0]);
  const zs = pts.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}

/**
 * จุดยืนหน้าตึก: เริ่มที่มุมตึกที่ใกล้จุด `toward` ที่สุด (ปกติคือกลางแคมปัส) แล้วถอยไปทาง `toward` อีก `gap` เมตร
 * ถ้ายังอยู่ในตึกนี้ (ตึกทรงเว้าอย่าง LX) หรือไปตกในตึกข้างๆ (`blocked`) ก็ถอยต่อจนพ้น
 * → NPC ไม่จมในตึก และอยู่ฝั่งที่หันเข้ากลางแคมปัส
 */
export function frontOf(footprint: Pt[], toward: Pt = [0, 0], gap = 6, blocked: Pt[][] = []): Pt {
  const dist = (p: Pt) => Math.hypot(p[0] - toward[0], p[1] - toward[1]);
  const corner = footprint.reduce((best, p) => (dist(p) < dist(best) ? p : best), footprint[0]);
  const len = dist(corner) || 1;
  const at = (step: number): Pt => [
    corner[0] + ((toward[0] - corner[0]) / len) * step,
    corner[1] + ((toward[1] - corner[1]) / len) * step,
  ];
  const inside = (p: Pt) => pointInPolygon(p, footprint) || blocked.some((poly) => pointInPolygon(p, poly));
  let step = gap;
  while (step < gap + 150 && inside(at(step))) step += 1;
  return at(step);
}

/** ตัวสุ่มที่ให้ค่าเดิมทุกครั้ง (mulberry32) — ต้นไม้ขึ้นที่เดิมทุกเครื่อง */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * ตำแหน่งต้นไม้: สุ่มในรั้ว แต่ไม่ทับตึก/น้ำ/สนาม และไม่ชิดตึกเกิน `clearance` เมตร
 */
export function scatterTrees(boundary: Pt[], blocked: Pt[][], count: number, seed = 1441, clearance = 4): Pt[] {
  const rand = seededRandom(seed);
  const b = bounds(boundary);
  const near = (p: Pt, poly: Pt[]) =>
    pointInPolygon(p, poly) ||
    [
      [clearance, 0],
      [-clearance, 0],
      [0, clearance],
      [0, -clearance],
    ].some(([ox, oz]) => pointInPolygon([p[0] + ox, p[1] + oz], poly));

  const out: Pt[] = [];
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    const p: Pt = [b.minX + rand() * (b.maxX - b.minX), b.minZ + rand() * (b.maxZ - b.minZ)];
    if (!pointInPolygon(p, boundary) || blocked.some((poly) => near(p, poly))) continue;
    out.push([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
  }
  return out;
}
