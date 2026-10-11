import { CAMPUS, landmarkBuilding, type LandmarkKey, type Pt } from "./data";
import { centroid, frontOf } from "./geometry";
import { HALL_FACING, HALL_LANDMARK, NPCS } from "./npcs";

// จุดยืนของ NPC / ประตู Hall และมุมกล้องตอนแตะ NPC — คำนวณครั้งเดียวตอนโหลดโมดูล ใช้ทั้งฉาก 3D และแผนที่ 2D

const ALL_BUILDINGS = CAMPUS.buildings.map((b) => b.pts);

/** หน้าตึกแลนด์มาร์ก หันไปทาง `toward` (ค่าเริ่มต้น = กลางแคมปัส) และไม่ทับตึกไหนเลย */
export function standingSpot(key: LandmarkKey, toward?: Pt): Pt {
  return frontOf(landmarkBuilding(key).pts, toward, 6, ALL_BUILDINGS);
}

export interface FocusView {
  position: [number, number, number];
  target: [number, number, number];
}

const FOCUS_BACK = 95;
const FOCUS_UP = 85;

/** กล้องตอนแตะ NPC: ถอยออกไปฝั่งที่ NPC หันหน้า (ตึกของ NPC อยู่ด้านหลัง) แล้วมองเฉียงลง */
export function focusView(spot: Pt, key: LandmarkKey): FocusView {
  const c = centroid(landmarkBuilding(key).pts);
  const len = Math.hypot(spot[0] - c[0], spot[1] - c[1]) || 1;
  const dx = (spot[0] - c[0]) / len;
  const dz = (spot[1] - c[1]) / len;
  return {
    position: [spot[0] + dx * FOCUS_BACK, FOCUS_UP, spot[1] + dz * FOCUS_BACK],
    target: [spot[0], 6, spot[1]],
  };
}

export const NPC_SPOTS: Record<string, Pt> = Object.fromEntries(
  NPCS.map((n) => [n.id, standingSpot(n.landmark, n.facing)]),
);
export const NPC_FOCUS: Record<string, FocusView> = Object.fromEntries(
  NPCS.map((n) => [n.id, focusView(NPC_SPOTS[n.id], n.landmark)]),
);
export const HALL_SPOT: Pt = standingSpot(HALL_LANDMARK, HALL_FACING);
