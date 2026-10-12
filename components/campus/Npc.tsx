"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type Ref } from "react";
import type * as THREE from "three";
import type { Pt } from "@/lib/campus/data";
import { COPY } from "@/lib/copy";

// ตัวละคร chibi หัวโต สร้างจากรูปทรงพื้นฐาน (ไม่ต้องโหลด asset) + ป้ายสถานะเหนือหัว
// ขนาดขยายเกินคนจริง (~6 ม.) เพื่อให้เห็นชัดบนแผนที่ระดับทั้งแคมปัส
// ป้ายเป็น DOM ใน overlay ของ CampusScene (ScreenOverlay.tsx) — ตัว 3D กับป้ายจึงแยกเป็นสอง component

export type NpcStatus = "danger" | "saved" | "soon";

export interface NpcMarkerProps {
  id: string;
  name: string;
  hook: string;
  position: Pt;
  shirt: string;
  hair: string;
  status: NpcStatus;
  selected: boolean;
  animate: boolean;
  onSelect: (id: string) => void;
}

const SKIN = "#f6d5b8";
const PANTS = "#1f2937";
const SCALE = 3.4;
/** ความสูงของป้ายเหนือหัว NPC / ประตู Hall (เมตร) */
export const NPC_BADGE_HEIGHT = SCALE * 2.1;
export const HALL_BADGE_HEIGHT = 9;

const BADGE: Record<NpcStatus, { icon: string; className: string }> = {
  danger: { icon: "❗", className: "bg-danger text-white animate-bounce" },
  saved: { icon: "✓", className: "bg-accept text-white" },
  soon: { icon: "⏳", className: "bg-surface-raised text-muted" },
};

export function NpcMarker({ id, position, shirt, hair, status, selected, animate, onSelect }: NpcMarkerProps) {
  const body = useRef<THREE.Group>(null);
  // เฟสต่างกันตามตำแหน่ง (คงที่) — NPC จะได้ไม่ขยับพร้อมกันทุกตัว
  const phase = (position[0] * 0.13 + position[1] * 0.07) % (Math.PI * 2);

  useFrame(({ clock }) => {
    if (!body.current) return;
    const t = clock.getElapsedTime() + phase;
    // ยังโดนหลอก = ตัวสั่นกระสับกระส่าย · ช่วยแล้ว = กระโดดดีใจเบาๆ
    body.current.position.y = animate
      ? status === "saved"
        ? Math.abs(Math.sin(t * 2.2)) * 0.6
        : Math.sin(t * 6) * 0.08
      : 0;
    body.current.rotation.y = animate && status === "danger" ? Math.sin(t * 1.5) * 0.25 : 0;
  });

  const select = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <group position={[position[0], 0, position[1]]}>
      {/* วงบนพื้น บอกตำแหน่ง + แตะง่ายขึ้น */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.15} onClick={select}>
        <circleGeometry args={[selected ? 7 : 5.5, 24]} />
        <meshBasicMaterial
          color={status === "danger" ? "#ef4444" : status === "saved" ? "#22c55e" : "#94a3b8"}
          transparent
          opacity={0.35}
        />
      </mesh>

      <group ref={body} scale={SCALE} onClick={select}>
        {/* ขา */}
        <mesh position={[-0.13, 0.22, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.44, 8]} />
          <meshStandardMaterial color={PANTS} />
        </mesh>
        <mesh position={[0.13, 0.22, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.44, 8]} />
          <meshStandardMaterial color={PANTS} />
        </mesh>
        {/* ตัว */}
        <mesh position-y={0.72}>
          <capsuleGeometry args={[0.28, 0.42, 4, 10]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
        {/* หัว + ผม */}
        <mesh position-y={1.42}>
          <sphereGeometry args={[0.42, 16, 12]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position-y={1.5} rotation-x={-0.2}>
          <sphereGeometry args={[0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hair} />
        </mesh>
        {/* มือถือแนบหู = กำลังคุยโทรศัพท์ */}
        <mesh position={[0.36, 1.35, 0.1]} rotation-z={0.3}>
          <boxGeometry args={[0.08, 0.26, 0.14]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>
    </group>
  );
}

// ป้ายลอยใน overlay — ตำแหน่ง (transform) ถูกเขียนทุกเฟรมโดย AnchorProjector จึงเริ่มแบบซ่อนไว้ก่อน
const FLOATING = "pointer-events-auto absolute left-0 top-0 invisible";

export function NpcBadge({
  id,
  name,
  hook,
  status,
  selected,
  onSelect,
  ref,
}: Pick<NpcMarkerProps, "id" | "name" | "hook" | "status" | "selected" | "onSelect"> & {
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(id)}
      className={`${FLOATING} flex flex-col items-center gap-1`}
      aria-label={`${name}: ${hook}`}
    >
      <span
        className={`relative flex size-8 items-center justify-center rounded-full text-lg font-bold shadow-lg transition ${selected ? "scale-125" : ""} ${BADGE[status].className}`}
      >
        {BADGE[status].icon}
        {status === "saved" && (
          <span aria-hidden className="pointer-events-none absolute -right-2 -top-2 text-sm motion-safe:animate-twinkle">
            ✨
          </span>
        )}
      </span>
      <span className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-slate-900 shadow">
        {name}
      </span>
    </button>
  );
}

/** ประตูเข้า Hall of Bangmod ที่ตึก SIT — วงสีทองบนพื้น */
export function HallPortal({ position, onOpen }: { position: Pt; onOpen: () => void }) {
  return (
    <mesh
      position={[position[0], 0.15, position[1]]}
      rotation-x={-Math.PI / 2}
      onClick={(e) => (e.stopPropagation(), onOpen())}
    >
      <circleGeometry args={[5.5, 24]} />
      <meshBasicMaterial color="#facc15" transparent opacity={0.45} />
    </mesh>
  );
}

export function HallBadge({ onOpen, ref }: { onOpen: () => void; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button ref={ref} type="button" onClick={onOpen} className={`${FLOATING} flex flex-col items-center gap-1`}>
      <span className="flex size-8 items-center justify-center rounded-full bg-yellow-400 text-lg shadow-lg">🏆</span>
      <span className="whitespace-nowrap rounded-full bg-yellow-300/95 px-2 py-0.5 text-[11px] font-bold text-slate-900 shadow">
        {COPY.hallTitle}
      </span>
    </button>
  );
}
