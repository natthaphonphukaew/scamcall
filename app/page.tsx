import Link from "next/link";
import { Screen } from "@/components/ui/Screen";
import { COPY } from "@/lib/copy";

// หน้าแรกชั่วคราว (Week 1) — หน้าจริงพร้อม disclaimer เต็มรูปแบบ + เลือกด่าน ทำใน Week 2
export default function Home() {
  return (
    <Screen className="justify-center gap-4">
      <h1 className="text-3xl font-bold">ScamCall</h1>
      <p className="text-muted">
        นี่คือ <strong className="text-text">{COPY.simulationBadge}</strong> เท่านั้น ไม่มีการโทรออกจริง
        และไม่ต้องใช้ข้อมูลจริงของคุณ — วางสายได้ทุกเมื่อ
      </p>
      <Link
        href="/call/police-money-laundering"
        className="rounded-card bg-accept px-5 py-3 text-center font-medium text-white"
      >
        ทดลองรับสาย: ตำรวจแจ้งบัญชีพัวพันคดีฟอกเงิน
      </Link>
    </Screen>
  );
}
