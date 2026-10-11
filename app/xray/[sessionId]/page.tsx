import { Suspense } from "react";
import XRayController from "./XRayController";

// ผลสายอยู่ใน sessionStorage ของ browser เท่านั้น → server แค่ส่ง sessionId ต่อให้ client
// await params ภายใน <Suspense> ตามแนวทาง Cache Components ของ Next 16
export default function XRayPage({ params }: PageProps<"/xray/[sessionId]">) {
  return (
    <Suspense fallback={null}>
      <XRay params={params} />
    </Suspense>
  );
}

async function XRay({ params }: Pick<PageProps<"/xray/[sessionId]">, "params">) {
  const { sessionId } = await params;
  return <XRayController sessionId={sessionId} />;
}
