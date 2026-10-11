"use client";

import type { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

// ป้าย DOM ที่ลอยตามจุด 3D (ป้าย NPC, ประตู Hall, ชื่อตึก) — ใช้ชั้น overlay ชั้นเดียวแทน drei <Html>
// ทุกเฟรมฉายจุด 3D → พิกัดจอ แล้วเขียน transform ใส่ element ตรงๆ (ไม่ re-render React, ไม่สร้าง React root ต่อป้าย)

export interface Anchor {
  id: string;
  position: [number, number, number];
}

/** ที่เก็บ element ของป้ายแต่ละอัน: `ref={anchorRef("npc:mint")}` */
export function useAnchorElements() {
  const elements = useRef(new Map<string, HTMLElement>());
  const anchorRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (!el) return;
      elements.current.set(id, el);
      return () => {
        elements.current.delete(id);
      };
    },
    [],
  );
  return { elements, anchorRef };
}

/**
 * อยู่ใน <Canvas> — ขยับป้ายทุกอันตามกล้อง ป้ายที่ใกล้กล้องกว่าอยู่บน
 * และตั้ง `data-near` ที่ overlay เมื่อกล้องเข้าใกล้เป้ากว่า `nearDistance(aspect)` เมตร (ใช้ซ่อน/โชว์ชื่อตึกด้วย CSS)
 */
export function AnchorProjector({
  anchors,
  elements,
  overlay,
  nearDistance,
}: {
  anchors: Anchor[];
  elements: RefObject<Map<string, HTMLElement>>;
  overlay: RefObject<HTMLDivElement | null>;
  nearDistance: (aspect: number) => number;
}) {
  const v = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, size, controls }) => {
    for (const a of anchors) {
      const el = elements.current.get(a.id);
      if (!el) continue;
      v.set(...a.position).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.visibility = v.z > 1 ? "hidden" : "visible"; // อยู่หลังกล้อง
      el.style.zIndex = String(Math.round((1 - v.z) * 1e4));
    }

    const c = controls as unknown as CameraControls | null;
    if (c && overlay.current) {
      const near =
        camera.position.distanceTo(c.getTarget(target)) < nearDistance(size.width / Math.max(1, size.height));
      overlay.current.setAttribute("data-near", String(near));
    }
  });

  return null;
}
