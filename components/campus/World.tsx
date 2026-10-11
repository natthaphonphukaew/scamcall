"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CAMPUS } from "@/lib/campus/data";
import { scatterTrees, seededRandom } from "@/lib/campus/geometry";
import { HALL_SPOT, NPC_SPOTS } from "@/lib/campus/spots";
import { extrude, flat, merge, ribbon } from "./three-utils";

// พื้น / สระ / สนาม / ถนน / ตึกทั่วไป / ต้นไม้ — ทุกอย่างรวมเป็นก้อนเดียวต่อวัสดุ (draw call น้อยสำหรับมือถือ)

export const PALETTE = {
  outside: "#a9c98f",
  campus: "#e9e6dc",
  road: "#c9c6bd",
  park: "#9fd38a",
  water: "#5fb6e8",
  pitch: "#6cc05a",
  track: "#c96f52",
  building: "#f4f3ef",
  roofEdge: "#d9d6cc",
  crown: "#4f9d4a",
  crownLight: "#6fb85f",
  trunk: "#7a5a3a",
};

// ระยะห่างระหว่างชั้นพื้นต้องมากพอ ไม่งั้นมองจากไกลจะกระพริบ (z-fighting) — ระดับ 0.3–1 ม. มองไม่ออกในสเกลแคมปัส
const AREA_Y = { park: 0.3, water: 0.5, track: 0.6, pitch: 0.9 } as const;
const ROAD_Y = 0.15;

export function Ground() {
  const geoms = useMemo(() => {
    const byKind = { park: [], water: [], track: [], pitch: [] } as Record<keyof typeof AREA_Y, THREE.BufferGeometry[]>;
    for (const a of CAMPUS.areas) byKind[a.kind].push(flat(a.pts, AREA_Y[a.kind]));
    return {
      campus: flat(CAMPUS.boundary, 0),
      roads: merge(CAMPUS.roads.map((r) => ribbon(r.pts, r.width, ROAD_Y))),
      ...Object.fromEntries(Object.entries(byKind).map(([k, list]) => [k, list.length ? merge(list) : null])),
    } as Record<string, THREE.BufferGeometry | null>;
  }, []);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.6} receiveShadow>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardMaterial color={PALETTE.outside} roughness={1} />
      </mesh>
      <mesh geometry={geoms.campus!} receiveShadow>
        <meshStandardMaterial color={PALETTE.campus} roughness={1} />
      </mesh>
      <mesh geometry={geoms.roads!}>
        <meshStandardMaterial color={PALETTE.road} roughness={1} />
      </mesh>
      {(["park", "track", "pitch", "water"] as const).map((k) =>
        geoms[k] ? (
          <mesh key={k} geometry={geoms[k]!}>
            <meshStandardMaterial
              color={PALETTE[k]}
              roughness={k === "water" ? 0.25 : 1}
              metalness={k === "water" ? 0.1 : 0}
            />
          </mesh>
        ) : null,
      )}
    </group>
  );
}

/** ตึกทั่วไปทั้งหมด (ไม่ใช่แลนด์มาร์ก) — กล่องขาวยกจากรูปร่างจริงใน OSM */
export function Buildings() {
  const geometry = useMemo(
    () => merge(CAMPUS.buildings.filter((b) => !b.landmark).map((b) => extrude(b.pts, b.levels * CAMPUS.floorHeight))),
    [],
  );
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.building} roughness={0.85} />
    </mesh>
  );
}

const TREE_COUNT = 420;
/** เว้นที่โล่งรอบ NPC/ประตู Hall (เมตร) — ไม่งั้นพุ่มไม้บังตัวละครตอนกล้องบินเข้าไป */
const CLEARING = 14;
const CLEAR_SPOTS = [...Object.values(NPC_SPOTS), HALL_SPOT];

/** ต้นไม้ low-poly แบบ instanced (ทรงพุ่ม icosahedron) — ตำแหน่งสุ่มแบบคงที่ ไม่ทับตึก/น้ำ/สนาม/จุดยืน NPC */
export function Trees() {
  const crowns = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);

  const spots = useMemo(() => {
    const blocked = [
      ...CAMPUS.buildings.map((b) => b.pts),
      ...CAMPUS.areas.filter((a) => a.kind !== "park").map((a) => a.pts),
    ];
    const pts = scatterTrees(CAMPUS.boundary, blocked, TREE_COUNT).filter((p) =>
      CLEAR_SPOTS.every((c) => Math.hypot(p[0] - c[0], p[1] - c[1]) > CLEARING),
    );
    const rand = seededRandom(7);
    return pts.map((p) => ({ p, s: 0.8 + rand() * 0.7, light: rand() > 0.6 }));
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const light = new THREE.Color(PALETTE.crownLight);
    const dark = new THREE.Color(PALETTE.crown);
    spots.forEach(({ p, s, light: isLight }, i) => {
      m.compose(new THREE.Vector3(p[0], 6.5 * s, p[1]), q, new THREE.Vector3(s, s, s));
      crowns.current?.setMatrixAt(i, m);
      crowns.current?.setColorAt(i, isLight ? light : dark);
      m.compose(new THREE.Vector3(p[0], 2 * s, p[1]), q, new THREE.Vector3(s, s, s));
      trunks.current?.setMatrixAt(i, m);
    });
    if (crowns.current) {
      crowns.current.instanceMatrix.needsUpdate = true;
      if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true;
    }
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
  }, [spots]);

  return (
    <group>
      <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow>
        <icosahedronGeometry args={[3.6, 0]} />
        <meshStandardMaterial flatShading roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[0.35, 0.5, 4, 5]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={1} />
      </instancedMesh>
    </group>
  );
}
