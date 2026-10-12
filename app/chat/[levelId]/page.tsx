import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getScenario, listScenariosByChannel, toChatIntro, toPublicScenario } from "@/lib/scenarios/load";
import ChatPageController from "./ChatPageController";

// ด่านแชททั้งหมดรู้ตั้งแต่ build → prerender ทุกด่าน (เหมือน /call/[levelId])
export function generateStaticParams() {
  return listScenariosByChannel("chat").map((s) => ({ levelId: s.id }));
}

export default function ChatPage({ params }: PageProps<"/chat/[levelId]">) {
  return (
    <Suspense fallback={null}>
      <Level params={params} />
    </Suspense>
  );
}

// Server component: ส่งแค่ข้อมูล public + ข้อความเปิดแชท ไป browser (persona/บทไม่หลุดไปฝั่ง client)
async function Level({ params }: Pick<PageProps<"/chat/[levelId]">, "params">) {
  const { levelId } = await params;
  const scenario = getScenario(levelId);
  if (!scenario || scenario.channel !== "chat") notFound();
  return <ChatPageController scenario={toPublicScenario(scenario)} intro={toChatIntro(scenario)} />;
}
