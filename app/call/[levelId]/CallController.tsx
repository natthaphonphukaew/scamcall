"use client";

import { useRouter } from "next/navigation";
import { EndedScreen } from "@/components/call/EndedScreen";
import { InCallScreen } from "@/components/call/InCallScreen";
import { RingingScreen } from "@/components/call/RingingScreen";
import { ConsentForm } from "@/components/consent/ConsentForm";
import { Screen } from "@/components/ui/Screen";
import { readConsent, useConsent, writeConsent } from "@/lib/consent";
import { ERROR_MESSAGES } from "@/lib/copy";
import { useLiveCall } from "@/lib/live/useLiveCall";
import { useRingtone } from "@/lib/live/useRingtone";
import type { PublicScenario } from "@/lib/types";

const canSaveTranscript = () => readConsent()?.saveTranscript === true;

/** ตัวเชื่อม: อ่าน state จาก useLiveCall แล้วเลือก screen — เปลี่ยนดีไซน์ = เปลี่ยน screen ไม่ต้องแตะไฟล์นี้มาก */
export default function CallController({ scenario }: { scenario: PublicScenario }) {
  const router = useRouter();
  const { ready, consent } = useConsent();
  const call = useLiveCall(scenario.id, canSaveTranscript);
  const errorMessage = call.error ? ERROR_MESSAGES[call.error] : null;

  useRingtone(consent !== null && call.status === "ringing" && call.error === null);

  if (!ready) return null;

  // เปิดลิงก์ด่านตรงๆ โดยยังไม่ยินยอม → ต้องผ่านข้อความแจ้งก่อน (CLAUDE.md ข้อ 7.3)
  if (!consent) {
    return (
      <Screen className="justify-center">
        <ConsentForm initial={null} onSubmit={writeConsent} />
      </Screen>
    );
  }

  switch (call.status) {
    case "ringing":
      return (
        <RingingScreen
          scenario={scenario}
          errorMessage={errorMessage}
          onAnswer={call.answer}
          onDecline={call.decline}
        />
      );
    case "connecting":
    case "in_call":
      return (
        <InCallScreen
          scenario={scenario}
          phase={call.status}
          elapsed={call.elapsed}
          remaining={call.remaining}
          turns={call.turns}
          isScammerSpeaking={call.isScammerSpeaking}
          onHangUp={call.hangUp}
        />
      );
    case "ended":
      return (
        <EndedScreen
          scenario={scenario}
          result={call.result!}
          errorMessage={errorMessage}
          saved={consent.saveTranscript}
          onRestart={call.reset}
          onBackToLevels={() => router.push("/levels")}
        />
      );
  }
}
