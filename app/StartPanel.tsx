"use client";

import { useRouter } from "next/navigation";
import { ConsentForm } from "@/components/consent/ConsentForm";
import { useConsent, writeConsent } from "@/lib/consent";
import { usePlayer } from "@/lib/game/playerStore";

export default function StartPanel() {
  const router = useRouter();
  const { ready, consent } = useConsent();
  const player = usePlayer(); // เริ่มสร้าง session guest ไว้ก่อน ระหว่างผู้ใช้อ่านหน้ายินยอม
  if (!ready) return null;

  return (
    <ConsentForm
      initial={consent}
      onSubmit={(c) => {
        writeConsent(c);
        // ยังไม่มีตัวละคร → สร้างก่อน (ข้ามได้ ถ้าระบบผู้เล่นปิด/ยังโหลดไม่เสร็จ — สร้างให้อัตโนมัติตอนเล่นจบสายแรก)
        const needsProfile = player.status === "ready" && player.me?.profile === null;
        router.push(needsProfile ? "/me?welcome=1" : "/campus");
      }}
    />
  );
}
