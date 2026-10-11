"use client";

import { useMemo, type Ref } from "react";
import * as THREE from "three";
import { CAMPUS, type CampusBuilding, type LandmarkKey } from "@/lib/campus/data";
import { centroid } from "@/lib/campus/geometry";
import { LANDMARK_INFO } from "@/lib/campus/npcs";
import { extrude, merge } from "./three-utils";

// แลนด์มาร์ก 7 แห่ง — รูปร่างจริงจาก OSM + ลักษณะเด่นจากรูปที่ Nut ส่ง (docs/GAME_SPEC.md ข้อ 9)
// low-poly stylize ให้จำได้ ไม่ใช่โมเดลละเอียด และไม่ใช้โลโก้ทางการ

const FH = CAMPUS.floorHeight;
const WHITE = "#f7f7f4";
const LX_ORANGE = "#f2643a";
const RED = "#c81e2b";
const GLASS = "#9ad7ea";

interface Part {
  geometry: THREE.BufferGeometry;
  color: string;
  glass?: boolean;
}

/** LX: แกนขาว + ชั้นโค้งยื่นออกมาไม่เท่ากันทุกชั้น (เหมือนชั้นซ้อนคลื่น) + เสาส้มแดง 3 ชั้นล่าง */
function lxParts(b: CampusBuilding): Part[] {
  const h = b.levels * FH;
  const slabs: THREE.BufferGeometry[] = [extrude(b.pts, h, 0, 0.8)];
  for (let i = 1; i <= b.levels; i++) {
    const wave = 1 + 0.07 * Math.sin(i * 0.85) - (i > b.levels * 0.6 ? 0.12 : 0); // ชั้นบนเล็กลงเป็นหอคอย
    slabs.push(extrude(b.pts, 0.8, i * FH - 0.8, wave));
  }
  const [cx, cz] = centroid(b.pts);
  const step = Math.max(1, Math.floor(b.pts.length / 6));
  const columns = b.pts
    .filter((_, i) => i % step === 0)
    .slice(0, 8)
    .map(([x, z]) => {
      const g = new THREE.CylinderGeometry(0.9, 0.9, FH * 3, 8);
      g.translate(cx + (x - cx) * 0.9, (FH * 3) / 2, cz + (z - cz) * 0.9);
      return g;
    });
  return [
    { geometry: merge(slabs), color: WHITE },
    { geometry: merge(columns), color: LX_ORANGE },
  ];
}

/** ตึกแดง: ตัวตึกแดง + แถบขาวทุก 2 ชั้น */
function redParts(b: CampusBuilding): Part[] {
  const h = b.levels * FH;
  const bands = Array.from({ length: Math.floor(b.levels / 2) }, (_, i) =>
    extrude(b.pts, 0.7, (i * 2 + 2) * FH - 0.7, 1.02),
  );
  return [
    { geometry: extrude(b.pts, h), color: RED },
    { geometry: merge(bands), color: WHITE },
  ];
}

/** หอสมุด: 2 ชั้นล่างเป็นกระจก (ด้านหน้ากระจกในรูป) + ตัวตึกขาวด้านบน */
function libraryParts(b: CampusBuilding): Part[] {
  return [
    { geometry: extrude(b.pts, FH * 2), color: GLASS, glass: true },
    {
      geometry: extrude(b.pts, (b.levels - 2) * FH, FH * 2, 0.96),
      color: WHITE,
    },
  ];
}

/** หอพัก: ตึกขาวสูง + แถบระเบียงสีเทาทุกชั้น */
function dormParts(b: CampusBuilding, tint: string): Part[] {
  const bands = Array.from({ length: b.levels - 1 }, (_, i) => extrude(b.pts, 0.5, (i + 1) * FH - 0.5, 1.03));
  return [
    { geometry: extrude(b.pts, b.levels * FH), color: WHITE },
    { geometry: merge(bands), color: tint },
  ];
}

function plainParts(b: CampusBuilding, color = WHITE): Part[] {
  return [{ geometry: extrude(b.pts, b.levels * FH), color }];
}

function partsFor(b: CampusBuilding): Part[] {
  switch (b.landmark) {
    case "lx":
      return lxParts(b);
    case "red":
      return redParts(b);
    case "library":
      return libraryParts(b);
    case "dorm_male":
      return dormParts(b, "#93c5fd");
    case "dorm_female":
      return dormParts(b, "#f9a8d4");
    case "kfc":
      return plainParts(b, "#fbfaf5");
    default:
      return plainParts(b);
  }
}

const LABEL_ICON: Record<LandmarkKey, string> = {
  lx: "🏢",
  library: "📚",
  sit: "💻",
  kfc: "🍜",
  dorm_male: "🏠",
  dorm_female: "🏠",
  red: "🔴",
};

const LANDMARK_ITEMS = CAMPUS.buildings
  .filter((b): b is CampusBuilding & { landmark: LandmarkKey } => Boolean(b.landmark))
  .map((b) => ({ b, top: b.levels * FH, c: centroid(b.pts) }));

/** จุดลอยของป้ายชื่อตึก (เหนือหลังคา 8 ม.) — ป้ายจริงอยู่ใน overlay ของ CampusScene */
export const LANDMARK_LABELS = LANDMARK_ITEMS.map(({ b, top, c }) => ({
  key: b.landmark,
  position: [c[0], top + 8, c[1]] as [number, number, number],
}));

export function Landmarks() {
  const items = useMemo(() => LANDMARK_ITEMS.map((item) => ({ ...item, parts: partsFor(item.b) })), []);

  return (
    <group>
      {items.map(({ b, parts }) => (
        <group key={b.id}>
          {parts.map((p, i) => (
            <mesh key={i} geometry={p.geometry} castShadow receiveShadow>
              <meshStandardMaterial
                color={p.color}
                roughness={p.glass ? 0.15 : 0.8}
                metalness={p.glass ? 0.2 : 0}
                transparent={p.glass}
                opacity={p.glass ? 0.85 : 1}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** ป้ายชื่อตึก — โชว์เฉพาะตอนซูมเข้า (overlay มี data-near="true") ไม่งั้นจะทับป้าย NPC */
export function LandmarkLabel({ landmark, ref }: { landmark: LandmarkKey; ref?: Ref<HTMLDivElement> }) {
  const info = LANDMARK_INFO[landmark];
  return (
    <div
      ref={ref}
      className="invisible absolute left-0 top-0 whitespace-nowrap rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-data-[near=true]:opacity-100"
    >
      {LABEL_ICON[landmark]} {info.label}
      <span className="ml-1 opacity-70">{info.ref}</span>
    </div>
  );
}
