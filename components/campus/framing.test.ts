import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { HALL_SPOT, NPC_FOCUS, NPC_SPOTS } from "@/lib/campus/spots";
import { CAMERA_FOV, focusTarget, homeViewFor } from "./framing";

const POINTS = [...Object.values(NPC_SPOTS), HALL_SPOT].map(([x, z]) => new THREE.Vector3(x, 7, z));

function project(view: ReturnType<ReturnType<typeof homeViewFor>>, aspect: number) {
  const cam = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 1, 10000);
  cam.position.copy(view.position);
  cam.lookAt(view.target);
  cam.updateMatrixWorld();
  return POINTS.map((p) => p.clone().project(cam));
}

describe("home camera framing", () => {
  for (const [label, aspect] of [
    ["phone portrait", 375 / 812],
    ["narrow phone", 360 / 800],
    ["tablet", 768 / 1024],
    ["laptop landscape", 1280 / 800],
  ] as const) {
    it(`keeps every NPC badge and the Hall on screen (${label})`, () => {
      const home = homeViewFor(POINTS);
      for (const p of project(home(aspect), aspect)) {
        expect(Math.abs(p.x)).toBeLessThan(0.9);
        expect(p.y).toBeGreaterThan(-0.8);
        expect(p.y).toBeLessThan(0.7);
        expect(p.z).toBeLessThan(1); // อยู่หน้ากล้อง
      }
    });
  }

  it("tilts the focus camera so the NPC sits between the HUD and the StoryCard", () => {
    const H = 812;
    const card = 334; // ความสูงการ์ดบนมือถือที่วัดได้จริง
    for (const f of Object.values(NPC_FOCUS)) {
      const aim = focusTarget(f.position, f.target, H, card);
      const cam = new THREE.PerspectiveCamera(CAMERA_FOV, 375 / H, 1, 10000);
      cam.position.set(...f.position);
      cam.lookAt(new THREE.Vector3(...aim));
      cam.updateMatrixWorld();
      const p = new THREE.Vector3(...f.target).project(cam);
      const screenY = ((1 - p.y) / 2) * H;
      expect(screenY).toBeCloseTo((80 + (H - card)) / 2, 0);
    }
  });

  it("keeps the original aim when nothing covers the screen", () => {
    const f = Object.values(NPC_FOCUS)[0];
    expect(focusTarget(f.position, f.target, 812, 0)).toEqual(f.target);
  });

  it("moves the camera back on narrow portrait screens", () => {
    const home = homeViewFor(POINTS);
    expect(home(375 / 812).distance).toBeGreaterThan(home(1280 / 800).distance);
  });
});
