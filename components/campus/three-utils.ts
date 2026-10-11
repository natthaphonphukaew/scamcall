import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Pt } from "@/lib/campus/data";
import { centroid } from "@/lib/campus/geometry";

// แปลงรูปร่าง 2D บนพื้น (x = ตะวันออก, z = ใต้) → geometry ของ three.js
// THREE.Shape อยู่บนระนาบ XY แล้วหมุน −90° รอบแกน X: shape (x, y) → world (x, 0, −y) จึงใส่ y = −z

export function toShape(pts: Pt[], scale = 1): THREE.Shape {
  const [cx, cz] = centroid(pts);
  const shape = new THREE.Shape();
  pts.forEach(([x, z], i) => {
    const sx = cx + (x - cx) * scale;
    const sz = cz + (z - cz) * scale;
    if (i === 0) shape.moveTo(sx, -sz);
    else shape.lineTo(sx, -sz);
  });
  shape.closePath();
  return shape;
}

/** ยกรูปร่างขึ้นเป็นแท่ง สูง `height` เมตร เริ่มที่ความสูง `base` · `scale` ย่อ/ขยายรอบจุดกลาง (ทำชั้นยื่น/แกนกลาง) */
export function extrude(pts: Pt[], height: number, base = 0, scale = 1): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(toShape(pts, scale), { depth: height, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, base, 0);
  return g;
}

/** พื้นราบ (สระ/สนาม/สวน) ที่ความสูง y */
export function flat(pts: Pt[], y: number): THREE.BufferGeometry {
  const g = new THREE.ShapeGeometry(toShape(pts));
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/** ถนนเป็นแถบแบน กว้าง `width` เมตร ตามเส้น polyline */
export function ribbon(pts: Pt[], width: number, y: number): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, z2 - z1) || 1;
    const nx = (-(z2 - z1) / len) * (width / 2);
    const nz = ((x2 - x1) / len) * (width / 2);
    const a = [x1 + nx, y, z1 + nz],
      b = [x1 - nx, y, z1 - nz],
      c = [x2 + nx, y, z2 + nz],
      d = [x2 - nx, y, z2 - nz];
    positions.push(...a, ...b, ...c, ...b, ...d, ...c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

/** รวมหลาย geometry เป็นก้อนเดียว = draw call เดียว (สำคัญบนมือถือ) */
export function merge(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of nonIndexed) {
    // ShapeGeometry/ExtrudeGeometry มี attribute ไม่เท่ากัน — เก็บแค่ position + normal
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
  }
  const merged = mergeGeometries(nonIndexed, false);
  if (!merged) throw new Error("mergeGeometries failed");
  return merged;
}

/** แปลงจุดบนพื้นเป็นตำแหน่ง 3D */
export const at = ([x, z]: Pt, y = 0): [number, number, number] => [x, y, z];
