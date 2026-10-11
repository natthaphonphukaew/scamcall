import raw from "./campus.json";

// ข้อมูลแผนที่ มจธ. บางมด (สร้างจาก OpenStreetMap ด้วย scripts/build-campus.mjs)
// พิกัดเป็นเมตร: x = ตะวันออก, z = ใต้ (ใน three.js −z คือทิศเหนือ) · © OpenStreetMap contributors

export type Pt = [number, number];

export type LandmarkKey = "lx" | "library" | "sit" | "kfc" | "dorm_male" | "dorm_female" | "red";

export interface CampusBuilding {
  id: number;
  landmark?: LandmarkKey;
  ref?: string;
  name: string;
  levels: number;
  pts: Pt[];
}

export interface CampusArea {
  kind: "water" | "park" | "pitch" | "track";
  name: string;
  pts: Pt[];
}

export interface CampusData {
  attribution: string;
  floorHeight: number;
  boundary: Pt[];
  buildings: CampusBuilding[];
  areas: CampusArea[];
  roads: { width: number; pts: Pt[] }[];
}

// JSON import ให้ number[][] — รูปร่างถูกตรวจแล้วตอน build (scripts/build-campus.mjs) และใน campus.test.ts
export const CAMPUS = raw as unknown as CampusData;

export function landmarkBuilding(key: LandmarkKey): CampusBuilding {
  const b = CAMPUS.buildings.find((x) => x.landmark === key);
  if (!b) throw new Error(`landmark ${key} missing from campus.json`);
  return b;
}
