import { describe, expect, it } from "vitest";
import { getScenario } from "@/lib/scenarios/load";
import { CAMPUS, landmarkBuilding, type LandmarkKey } from "./data";
import { centroid, frontOf, pointInPolygon, scatterTrees, seededRandom } from "./geometry";
import { HALL_LANDMARK, LANDMARK_INFO, NPCS } from "./npcs";
import { HALL_SPOT, NPC_FOCUS, NPC_SPOTS } from "./spots";

const SQUARE: [number, number][] = [
  [-10, -10],
  [10, -10],
  [10, 10],
  [-10, 10],
];

describe("campus data (from OpenStreetMap)", () => {
  it("has all 7 landmarks with the expected building refs", () => {
    for (const key of Object.keys(LANDMARK_INFO) as LandmarkKey[]) {
      expect(landmarkBuilding(key).ref).toBe(LANDMARK_INFO[key].ref);
    }
  });

  it("matches the master plan layout: library/SIT north of LX, dorms in the south, KFC west by the stadium", () => {
    const c = (k: LandmarkKey) => centroid(landmarkBuilding(k).pts);
    const [, lxZ] = c("lx");
    expect(c("library")[1]).toBeLessThan(lxZ); // −z = north
    expect(c("sit")[1]).toBeLessThan(lxZ);
    expect(c("dorm_male")[1]).toBeGreaterThan(lxZ + 150);
    expect(c("dorm_female")[1]).toBeGreaterThan(c("dorm_male")[1]);
    expect(c("kfc")[0]).toBeLessThan(c("lx")[0] - 200); // west
  });

  it("keeps every building inside the campus boundary", () => {
    for (const b of CAMPUS.buildings) expect(pointInPolygon(centroid(b.pts), CAMPUS.boundary)).toBe(true);
  });

  it("uses the researched height for LX (15 floors)", () => {
    expect(landmarkBuilding("lx").levels).toBe(15);
  });
});

describe("geometry", () => {
  it("frontOf puts a point outside the footprint, on the side facing the target", () => {
    const p = frontOf(SQUARE, [100, 0], 5);
    expect(pointInPolygon(p, SQUARE)).toBe(false);
    expect(p[0]).toBeGreaterThan(10);
  });

  it("frontOf works for concave buildings whose centre is outside the footprint (like LX)", () => {
    const U: [number, number][] = [
      [-10, -10],
      [10, -10],
      [10, 10],
      [5, 10],
      [5, -5],
      [-5, -5],
      [-5, 10],
      [-10, 10],
    ];
    for (const target of [
      [0, 100],
      [0, -100],
      [100, 0],
      [-100, 0],
    ] as [number, number][]) {
      expect(pointInPolygon(frontOf(U, target), U)).toBe(false);
    }
  });

  it("frontOf also steps past neighbouring buildings", () => {
    const neighbour: [number, number][] = [
      [12, -5],
      [30, -5],
      [30, 5],
      [12, 5],
    ];
    const p = frontOf(SQUARE, [100, 0], 5, [neighbour]);
    expect(pointInPolygon(p, SQUARE)).toBe(false);
    expect(pointInPolygon(p, neighbour)).toBe(false);
  });

  it("seededRandom is deterministic", () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("scatterTrees never plants inside blocked areas", () => {
    const boundary: [number, number][] = [
      [-50, -50],
      [50, -50],
      [50, 50],
      [-50, 50],
    ];
    const trees = scatterTrees(boundary, [SQUARE], 100);
    expect(trees.length).toBe(100);
    for (const t of trees) {
      expect(pointInPolygon(t, boundary)).toBe(true);
      expect(pointInPolygon(t, SQUARE)).toBe(false);
    }
  });
});

describe("NPCs", () => {
  it("each NPC stands at a different landmark, and the Hall uses its own", () => {
    const spots = NPCS.map((n) => n.landmark);
    expect(new Set(spots).size).toBe(spots.length);
    expect(spots).not.toContain(HALL_LANDMARK);
  });

  it("every NPC and the Hall portal stand outside every campus building", () => {
    const spots = [...Object.entries(NPC_SPOTS), ["hall", HALL_SPOT] as const];
    for (const [id, p] of spots) {
      for (const b of CAMPUS.buildings) expect(pointInPolygon(p, b.pts), `${id} inside ${b.ref ?? b.id}`).toBe(false);
    }
  });

  it("spots are far enough apart that the floating badges don't overlap", () => {
    const spots = [...Object.entries(NPC_SPOTS), ["hall", HALL_SPOT] as const];
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const [a, p] = spots[i];
        const [b, q] = spots[j];
        expect(Math.hypot(p[0] - q[0], p[1] - q[1]), `${a} ↔ ${b}`).toBeGreaterThan(70);
      }
    }
  });

  it("tapping an NPC frames them with no building between the camera and the NPC", () => {
    const blockedBy = (from: [number, number, number], to: [number, number, number]) => {
      const len = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
      // ตัดช่วง 4 ม. สุดท้ายออก — NPC ยืนชิดตึกของตัวเอง
      for (let d = 0; d < len - 4; d += 1) {
        const t = d / len;
        const x = from[0] + (to[0] - from[0]) * t;
        const y = from[1] + (to[1] - from[1]) * t;
        const z = from[2] + (to[2] - from[2]) * t;
        const hit = CAMPUS.buildings.find((b) => y < b.levels * CAMPUS.floorHeight && pointInPolygon([x, z], b.pts));
        if (hit) return hit.ref ?? String(hit.id);
      }
      return null;
    };
    for (const n of NPCS) {
      const f = NPC_FOCUS[n.id];
      const [x, , z] = f.target;
      expect(blockedBy(f.position, [x, 1.5, z]), n.id).toBeNull();
    }
  });

  it("call NPCs point at real levels (chat levels arrive in Phase 3)", () => {
    for (const n of NPCS.filter((n) => n.channel === "call")) expect(getScenario(n.levelId)).not.toBeNull();
  });
});
