// แปลงข้อมูล OSM (scripts/.osm-cache) → lib/campus/campus.json สำหรับแผนที่ 3D
// - พิกัดเป็นเมตร รอบจุดกลางแคมปัส: x = ตะวันออก, z = ใต้ (แกน three.js: −z = ทิศเหนือ)
// - เก็บเฉพาะสิ่งที่อยู่ในรั้ว มจธ. บางมด, ลดจำนวนจุดของรูปร่าง, ปัดทศนิยม 1 ตำแหน่ง
// - แลนด์มาร์ก 7 แห่ง (docs/GAME_SPEC.md ข้อ 9) ผูกด้วย OSM way id + กำหนดจำนวนชั้น/สไตล์เอง
// ข้อมูล © OpenStreetMap contributors (ODbL)

import { readFile, writeFile } from "node:fs/promises";

const cache = (f) => readFile(new URL(`./.osm-cache/${f}`, import.meta.url), "utf8").then((s) => JSON.parse(s).elements);
const [campusEls, buildingEls, areaEls, roadEls] = await Promise.all(
  ["campus.json", "buildings.json", "areas.json", "roads.json"].map(cache),
);

// ---- แลนด์มาร์ก: OSM way id → ข้อมูลที่ OSM ไม่มี (จำนวนชั้นจากแหล่งอ้างอิง/ประมาณจากรูปของ Nut) ----
const LANDMARKS = {
  1333533935: { key: "lx", ref: "N16", levels: 15, note: "15 ชั้น (sustainable.kmutt.ac.th)" },
  311879209: { key: "library", ref: "N10", levels: 5, note: "Nut ยืนยัน: ตึกหลังทางเข้า 5 ชั้น" },
  224982053: { key: "sit", ref: "N11", levels: 5, note: "ประมาณจากรูป (ตัวอาคารหน้า 4–5 ชั้น)" },
  346449664: { key: "kfc", ref: "S14", levels: 4, note: "KFC อยู่ชั้น 2 ของอาคาร (kmutt.ac.th) · สูงประมาณจากรูป" },
  420045662: { key: "dorm_male", ref: "S5", levels: null, note: "จำนวนชั้นจาก OSM" },
  420051710: { key: "dorm_female", ref: "S6", levels: null, note: "จำนวนชั้นจาก OSM" },
  420044928: { key: "red", ref: "S4", levels: null, note: "จำนวนชั้นจาก OSM" },
};

const DEFAULT_LEVELS = 4;

// ---- projection ----
const boundaryEl = campusEls.find((e) => e.tags?.name?.includes("พระจอมเกล้าธนบุรี") && e.geometry);
if (!boundaryEl) throw new Error("campus boundary not found");
const lat0 = boundaryEl.geometry.reduce((s, p) => s + p.lat, 0) / boundaryEl.geometry.length;
const lon0 = boundaryEl.geometry.reduce((s, p) => s + p.lon, 0) / boundaryEl.geometry.length;
const M_LAT = 110574;
const M_LON = 111320 * Math.cos((lat0 * Math.PI) / 180);
const project = (p) => [(p.lon - lon0) * M_LON, -(p.lat - lat0) * M_LAT]; // [x, z]
const r1 = (n) => Math.round(n * 10) / 10;

// ---- geometry helpers ----
function simplify(pts, tol) {
  if (pts.length <= 3) return pts;
  const d2 = (p, a, b) => {
    const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
    const dx = x2 - x1, dy = y2 - y1;
    const t = dx || dy ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))) : 0;
    const ex = x1 + t * dx - x, ey = y1 + t * dy - y;
    return ex * ex + ey * ey;
  };
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = d2(pts[i], pts[s], pts[e]);
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (max > tol * tol) {
      keep[idx] = true;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
const signedArea = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const centroid = (pts) => pts.reduce((c, p) => [c[0] + p[0] / pts.length, c[1] + p[1] / pts.length], [0, 0]);
function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/** วงปิด → ตัดจุดซ้ำท้าย, ลดจุด, เรียงทวนเข็ม (ตามที่ THREE.Shape ต้องการ), ปัดทศนิยม */
function ring(geometry, tol = 0.6) {
  let pts = geometry.map(project);
  const [a, b] = [pts[0], pts.at(-1)];
  if (a[0] === b[0] && a[1] === b[1]) pts = pts.slice(0, -1);
  pts = simplify(pts, tol);
  if (signedArea(pts) < 0) pts.reverse();
  return pts.map(([x, z]) => [r1(x), r1(z)]);
}

const boundary = ring(boundaryEl.geometry, 1);
const isOnCampus = (pts) => inside(centroid(pts), boundary);

// ---- buildings ----
const buildings = [];
for (const el of buildingEls) {
  if (!el.geometry || el.geometry.length < 4) continue;
  const pts = ring(el.geometry);
  if (pts.length < 3 || !isOnCampus(pts)) continue;
  const t = el.tags ?? {};
  const lm = LANDMARKS[el.id];
  const tagged = Number.parseInt(t["building:levels"], 10);
  const levels = lm?.levels ?? (Number.isFinite(tagged) ? tagged : DEFAULT_LEVELS);
  buildings.push({
    id: el.id,
    ...(lm ? { landmark: lm.key, ref: lm.ref } : {}),
    name: t.name ?? t["name:en"] ?? "",
    levels,
    pts,
  });
}
for (const id of Object.keys(LANDMARKS)) {
  if (!buildings.some((b) => String(b.id) === id)) throw new Error(`landmark ${id} (${LANDMARKS[id].key}) missing from data`);
}

// ---- areas ----
const areas = [];
for (const el of areaEls) {
  if (!el.geometry || el.geometry.length < 4) continue;
  const pts = ring(el.geometry, 0.8);
  if (!isOnCampus(pts)) continue;
  const t = el.tags ?? {};
  const kind = t.natural === "water" ? "water" : t.leisure === "track" ? "track" : t.leisure === "pitch" ? "pitch" : "park";
  areas.push({ kind, name: t.name ?? "", pts });
}

// ---- roads (เฉพาะในรั้ว) ----
const ROAD_WIDTH = { primary: 12, secondary: 10, tertiary: 8, residential: 7, unclassified: 7, service: 5, living_street: 5, pedestrian: 4, footway: 2.5, path: 2.5, cycleway: 2.5 };
const roads = [];
for (const el of roadEls) {
  const kind = el.tags?.highway;
  if (!el.geometry || !ROAD_WIDTH[kind] || el.tags?.tunnel === "yes") continue;
  const pts = simplify(el.geometry.map(project), 0.8).map(([x, z]) => [r1(x), r1(z)]);
  if (!pts.some((p) => inside(p, boundary))) continue;
  roads.push({ width: ROAD_WIDTH[kind], pts });
}

const out = {
  attribution: "© OpenStreetMap contributors (ODbL)",
  origin: { lat: r1(lat0 * 1e5) / 1e5, lon: r1(lon0 * 1e5) / 1e5 },
  generated: new Date().toISOString().slice(0, 10),
  floorHeight: 3.6,
  boundary,
  buildings,
  areas,
  roads,
};
const json = JSON.stringify(out);
await writeFile(new URL("../lib/campus/campus.json", import.meta.url), json);

const xs = boundary.map((p) => p[0]), zs = boundary.map((p) => p[1]);
console.log(`campus.json: ${(json.length / 1024).toFixed(0)} KB · ${buildings.length} buildings · ${areas.length} areas · ${roads.length} roads`);
console.log(`extent x[${Math.min(...xs)}, ${Math.max(...xs)}] z[${Math.min(...zs)}, ${Math.max(...zs)}] m`);
for (const b of buildings.filter((b) => b.landmark)) {
  const [cx, cz] = centroid(b.pts);
  console.log(`  ${b.ref.padEnd(4)} ${b.landmark.padEnd(12)} levels=${String(b.levels).padEnd(3)} centre=(${cx.toFixed(0)}, ${cz.toFixed(0)}) ${b.name}`);
}
