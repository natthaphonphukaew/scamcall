// ดึงข้อมูลแผนที่ มจธ. บางมด จาก OpenStreetMap (Overpass API) → scripts/.osm-cache/*.json
// ใช้: node scripts/fetch-osm.mjs   แล้วตามด้วย   node scripts/build-campus.mjs
// ข้อมูล © OpenStreetMap contributors (ODbL) — ต้องแสดงเครดิตบนแผนที่

import { mkdir, writeFile } from "node:fs/promises";

const BBOX = "13.6460,100.4900,13.6555,100.4990"; // ใต้,ตะวันตก,เหนือ,ตะวันออก
const QUERIES = {
  campus: `[out:json][timeout:25];way["amenity"="university"](13.6400,100.4850,13.6600,100.5050);out geom;`,
  buildings: `[out:json][timeout:25];way["building"](${BBOX});out geom;`,
  areas: `[out:json][timeout:25];(way["natural"="water"](${BBOX});way["leisure"~"pitch|track|park|garden|stadium"](${BBOX}););out geom;`,
  roads: `[out:json][timeout:25];way["highway"](${BBOX});out geom;`,
};
const ENDPOINT = "https://overpass-api.de/api/interpreter";
const HEADERS = { "User-Agent": "ScamCall-student-project/0.1 (educational)", Accept: "application/json" };

const outDir = new URL("./.osm-cache/", import.meta.url);
await mkdir(outDir, { recursive: true });

for (const [name, query] of Object.entries(QUERIES)) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(ENDPOINT, { method: "POST", headers: HEADERS, body: new URLSearchParams({ data: query }) });
    if (res.ok) {
      await writeFile(new URL(`${name}.json`, outDir), await res.text());
      console.log(`${name}: ok`);
      break;
    }
    console.log(`${name}: HTTP ${res.status} (attempt ${attempt}) — Overpass มักไม่ว่าง รอแล้วลองใหม่`);
    if (attempt === 5) process.exit(1);
    await new Promise((r) => setTimeout(r, 6000));
  }
}
