import type { Metadata } from "next";
import { listScenarios, toPublicScenario } from "@/lib/scenarios/load";
import CampusController from "./CampusController";

export const metadata: Metadata = { title: "แคมปัสบางมด — ScamCall" };

// แผนที่แคมปัส มจธ. บางมด (หน้าหลักของเกม) — ส่งแค่ข้อมูลด่านแบบ public ไป browser
export default function CampusPage() {
  return <CampusController levels={listScenarios().map(toPublicScenario)} />;
}
