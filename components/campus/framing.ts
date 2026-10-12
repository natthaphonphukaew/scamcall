import * as THREE from "three";

// มุมกล้องเริ่มต้นของแผนที่: มองจากทิศใต้ค่อนตะวันออก เฉียงลง ~50°
// ระยะกล้องคำนวณให้ป้ายทุกอันอยู่ในจอพอดี ตามสัดส่วนจอจริง (มือถือแนวตั้ง / จอแนวนอน)

export const CAMERA_FOV = 38;
const HOME_DIR = new THREE.Vector3(70, 640, 520).normalize();
/** กรอบปลอดภัยของจุดกลางป้ายในพิกัด NDC (−1..1): ข้างๆ เว้นให้ชื่อ NPC ไม่ล้นจอ · บนเว้นให้ HUD · ล่างเว้นให้คำใบ้ */
const SAFE = { left: -0.78, right: 0.78, bottom: -0.78, top: 0.68 };

export interface HomeView {
  position: THREE.Vector3;
  target: THREE.Vector3;
  distance: number;
}

function computeHomeView(points: THREE.Vector3[], aspect: number): HomeView {
  const target = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()).setY(0);
  const cam = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 1, 10000);
  const p = new THREE.Vector3();
  const fits = (distance: number) => {
    cam.position.copy(HOME_DIR).multiplyScalar(distance).add(target);
    cam.lookAt(target);
    cam.updateMatrixWorld();
    return points.every((pt) => {
      p.copy(pt).project(cam);
      return p.x >= SAFE.left && p.x <= SAFE.right && p.y >= SAFE.bottom && p.y <= SAFE.top;
    });
  };
  // ถอยกล้อง = จุดเข้าหากลางจอ → หาเลขระยะที่ใกล้ที่สุดที่ยังพอดีด้วย binary search
  let lo = 50;
  let hi = 5000;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return { position: HOME_DIR.clone().multiplyScalar(hi).add(target), target, distance: hi };
}

/** คืนฟังก์ชัน aspect → มุมกล้องเริ่มต้น (จำผลล่าสุดไว้ เพราะถูกเรียกทุกเฟรม) */
export function homeViewFor(points: THREE.Vector3[]): (aspect: number) => HomeView {
  let last: { aspect: number; view: HomeView } | null = null;
  return (aspect) => {
    if (!last || Math.abs(last.aspect - aspect) > 1e-3) last = { aspect, view: computeHomeView(points, aspect) };
    return last.view;
  };
}

/** ความสูงของ HUD ด้านบนจอ (px) — ตัวละครที่โฟกัสไม่ควรไปอยู่ใต้ HUD */
const TOP_INSET = 80;

type Vec3 = [number, number, number];

/**
 * จุดเล็งใหม่ตอนโฟกัส NPC: กล้องอยู่ที่เดิม (ตำแหน่งที่ test เช็กแล้วว่าไม่มีตึกบัง) แต่ก้มลงเล็กน้อย
 * ให้ NPC ไปอยู่กลางช่องว่างระหว่าง HUD ด้านบนกับการ์ดที่บังด้านล่างจอ (`bottomInset` px)
 * — ไม่งั้น StoryCard บนมือถือจะบังตัวละคร
 */
export function focusTarget(position: Vec3, target: Vec3, screenHeight: number, bottomInset: number): Vec3 {
  const shiftPx = Math.max(0, (bottomInset - TOP_INSET) / 2);
  if (shiftPx === 0) return target;
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
  const angle = Math.atan((shiftPx / (Math.max(1, screenHeight) / 2)) * tanHalf);

  const pos = new THREE.Vector3(...position);
  const dir = new THREE.Vector3(...target).sub(pos).normalize();
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  const camUp = new THREE.Vector3().crossVectors(right, dir).normalize();
  // ก้มลง: หมุนทิศมองเข้าหา "ล่างจอ" แล้วหาจุดตัดกับระนาบความสูงเดิมของเป้า
  const aim = dir.multiplyScalar(Math.cos(angle)).addScaledVector(camUp, -Math.sin(angle));
  const t = (target[1] - pos.y) / aim.y;
  return pos.addScaledVector(aim, t).toArray() as Vec3;
}
