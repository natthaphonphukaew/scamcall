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
