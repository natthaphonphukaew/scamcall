"use client";

import { CameraControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CAMPUS, type Pt } from "@/lib/campus/data";
import type { FocusView } from "@/lib/campus/spots";
import { bounds } from "@/lib/campus/geometry";
import { LANDMARK_LABELS, LandmarkLabel, Landmarks } from "./Landmarks";
import {
  HALL_BADGE_HEIGHT,
  HallBadge,
  HallPortal,
  NPC_BADGE_HEIGHT,
  NpcBadge,
  NpcMarker,
  type NpcMarkerProps,
} from "./Npc";
import { CAMERA_FOV, focusTarget, homeViewFor, type HomeView } from "./framing";
import { AnchorProjector, useAnchorElements, type Anchor } from "./ScreenOverlay";
import { Buildings, Ground, Trees } from "./World";

// ฉาก 3D แคมปัส — หน้าตาล้วน รับข้อมูลผ่าน props (logic อยู่ที่ app/campus/CampusController.tsx)
// โหลดด้วย next/dynamic (ssr: false) และ unmount ทันทีที่เข้าสาย/แชท

export interface CampusSceneProps {
  /** `focus` = มุมกล้องตอนแตะ NPC (lib/campus/spots.ts) */
  npcs: (Omit<NpcMarkerProps, "selected" | "animate" | "onSelect"> & { focus: FocusView })[];
  hallPosition: Pt;
  selectedId: string | null;
  /** ความสูง (px) ของ UI ที่บังด้านล่างจอตอนเลือก NPC (StoryCard) — กล้องจะยกตัวละครขึ้นพ้นการ์ด */
  bottomInset: number;
  reducedMotion: boolean;
  onSelect: (id: string | null) => void;
  onOpenHall: () => void;
}

/** ชื่อตึกโชว์เมื่อซูมเข้ามาราว 1/3 จากมุมเริ่มต้น — ที่มุมเริ่มต้นชื่อตึกจะทับป้าย NPC */
const LABELS_NEAR_RATIO = 0.65;

function CameraRig({
  focus,
  home,
  bottomInset,
  reducedMotion,
}: {
  focus: FocusView | null;
  home: (aspect: number) => HomeView;
  bottomInset: number;
  reducedMotion: boolean;
}) {
  const controls = useRef<CameraControls>(null);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const height = useThree((s) => s.size.height);
  // แตกเป็นตัวเลข → effect ไม่วิ่งซ้ำ (กล้องไม่เด้งกลับ) ตอน parent re-render ด้วยค่าเดิม
  const view = home(aspect);
  const [px, py, pz] = view.position.toArray();
  const [tx, ty, tz] = view.target.toArray();

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const b = bounds(CAMPUS.boundary);
    c.setBoundary(new THREE.Box3(new THREE.Vector3(b.minX, 0, b.minZ), new THREE.Vector3(b.maxX, 10, b.maxZ)));
  }, []);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const animate = !reducedMotion;
    if (focus) {
      void c.setLookAt(...focus.position, ...focusTarget(focus.position, focus.target, height, bottomInset), animate);
    } else {
      void c.setLookAt(px, py, pz, tx, ty, tz, animate);
    }
  }, [focus, height, bottomInset, reducedMotion, px, py, pz, tx, ty, tz]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={45}
      maxDistance={2500}
      minPolarAngle={0.15}
      maxPolarAngle={1.2}
      smoothTime={reducedMotion ? 0 : 0.4}
      dollySpeed={0.7}
    />
  );
}

export default function CampusScene({
  npcs,
  hallPosition,
  selectedId,
  bottomInset,
  reducedMotion,
  onSelect,
  onOpenHall,
}: CampusSceneProps) {
  const [dpr, setDpr] = useState(1.5);
  const [effects, setEffects] = useState(true); // เงา — ปิดอัตโนมัติถ้าเครื่องไม่ไหว
  const focus = npcs.find((n) => n.id === selectedId)?.focus ?? null;
  const home = useMemo(
    () =>
      homeViewFor([
        ...npcs.map((n) => new THREE.Vector3(n.position[0], NPC_BADGE_HEIGHT, n.position[1])),
        new THREE.Vector3(hallPosition[0], HALL_BADGE_HEIGHT, hallPosition[1]),
      ]),
    [npcs, hallPosition],
  );
  const overlay = useRef<HTMLDivElement>(null);
  const { elements, anchorRef } = useAnchorElements();
  const anchors = useMemo<Anchor[]>(
    () => [
      ...LANDMARK_LABELS.map((l) => ({
        id: `lm:${l.key}`,
        position: l.position,
      })),
      ...npcs.map((n) => ({
        id: `npc:${n.id}`,
        position: [n.position[0], NPC_BADGE_HEIGHT, n.position[1]] as Anchor["position"],
      })),
      {
        id: "hall",
        position: [hallPosition[0], HALL_BADGE_HEIGHT, hallPosition[1]],
      },
    ],
    [npcs, hallPosition],
  );

  return (
    // isolate = ป้ายทั้งหมดอยู่ใต้ HUD/StoryCard เสมอ
    <div className="relative isolate h-full w-full">
      <Canvas
        shadows={effects}
        dpr={[1, dpr]}
        camera={{
          position: home(0.5).position.toArray(),
          fov: CAMERA_FOV,
          near: 5,
          far: 5000,
        }}
        onPointerMissed={() => onSelect(null)}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1);
            setEffects(false);
          }}
        />
        <color attach="background" args={["#cfe8f7"]} />
        <fog attach="fog" args={["#cfe8f7", 900, 2200]} />
        <hemisphereLight args={["#ffffff", "#8fbf7a", 1.1]} />
        <directionalLight
          position={[320, 520, 260]}
          intensity={1.7}
          castShadow={effects}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-450}
          shadow-camera-right={450}
          shadow-camera-top={450}
          shadow-camera-bottom={-450}
          shadow-camera-far={1500}
        />

        <Ground />
        <Buildings />
        <Landmarks />
        <Trees />

        {npcs.map((n) => (
          <NpcMarker key={n.id} {...n} selected={n.id === selectedId} animate={!reducedMotion} onSelect={onSelect} />
        ))}
        <HallPortal position={hallPosition} onOpen={onOpenHall} />

        <CameraRig focus={focus} home={home} bottomInset={bottomInset} reducedMotion={reducedMotion} />
        <AnchorProjector
          anchors={anchors}
          elements={elements}
          overlay={overlay}
          nearDistance={(aspect) => home(aspect).distance * LABELS_NEAR_RATIO}
        />
      </Canvas>

      {/* ป้าย DOM ลอยเหนือ canvas: ชื่อตึกอยู่ชั้นล่าง ป้าย NPC/Hall อยู่ชั้นบน */}
      <div ref={overlay} data-near="false" className="group pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {LANDMARK_LABELS.map((l) => (
            <LandmarkLabel key={l.key} landmark={l.key} ref={anchorRef(`lm:${l.key}`)} />
          ))}
        </div>
        <div className="absolute inset-0 z-10">
          {npcs.map((n) => (
            <NpcBadge
              key={n.id}
              {...n}
              selected={n.id === selectedId}
              onSelect={onSelect}
              ref={anchorRef(`npc:${n.id}`)}
            />
          ))}
          <HallBadge onOpen={onOpenHall} ref={anchorRef("hall")} />
        </div>
      </div>
    </div>
  );
}
