import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getScenario, listScenariosByChannel, toPublicScenario } from "@/lib/scenarios/load";
import CallController from "./CallController";

// ด่านทั้งหมดรู้ตั้งแต่ build → prerender ทุกด่าน (Cache Components ต้องการอย่างน้อย 1 param)
export function generateStaticParams() {
  return listScenariosByChannel("call").map((s) => ({ levelId: s.id }));
}

// await params ภายใน <Suspense> ตามแนวทาง Cache Components + Partial Prefetching ของ Next 16
export default function CallPage({ params }: PageProps<"/call/[levelId]">) {
  return (
    <Suspense fallback={null}>
      <Level params={params} />
    </Suspense>
  );
}

// Server component: โหลดด่านฝั่ง server แล้วส่งแค่ข้อมูล public ไป browser (persona/บทไม่หลุดไปฝั่ง client)
async function Level({ params }: Pick<PageProps<"/call/[levelId]">, "params">) {
  const { levelId } = await params;
  const scenario = getScenario(levelId);
  if (!scenario || scenario.channel === "chat") notFound();
  return <CallController scenario={toPublicScenario(scenario)} />;
}
