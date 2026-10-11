import { Suspense } from "react";
import { listScenarios } from "@/lib/scenarios/load";
import MeController from "./MeController";

// โปรไฟล์ผู้เล่น — ข้อมูลทั้งหมดโหลดฝั่ง browser ผ่าน /api/me (ต่อผู้เล่น ไม่ prerender)
// Suspense: MeController อ่าน ?welcome / ?auth_error ด้วย useSearchParams
export default function MePage() {
  return (
    <Suspense fallback={null}>
      <MeController levelCount={listScenarios().length} />
    </Suspense>
  );
}
