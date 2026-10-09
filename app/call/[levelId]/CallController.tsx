"use client";

import { EndedScreen } from "@/components/call/EndedScreen";
import { InCallScreen } from "@/components/call/InCallScreen";
import { RingingScreen } from "@/components/call/RingingScreen";
import { ERROR_MESSAGES } from "@/lib/copy";
import { useLiveCall } from "@/lib/live/useLiveCall";
import type { PublicScenario } from "@/lib/types";

/** ตัวเชื่อม: อ่าน state จาก useLiveCall แล้วเลือก screen — เปลี่ยนดีไซน์ = เปลี่ยน screen ไม่ต้องแตะไฟล์นี้มาก */
export default function CallController({ scenario }: { scenario: PublicScenario }) {
  const call = useLiveCall(scenario.id);
  const errorMessage = call.error ? ERROR_MESSAGES[call.error] : null;

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
        <EndedScreen scenario={scenario} result={call.result!} errorMessage={errorMessage} onRestart={call.reset} />
      );
  }
}
