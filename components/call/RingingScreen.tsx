import { PhoneIcon } from "@/components/ui/PhoneIcon";
import { COPY } from "@/lib/copy";
import { CallerAvatar } from "./CallerAvatar";
import { SlideToAnswer } from "./SlideToAnswer";
import type { RingingScreenProps } from "./types";

// หน้าสายเรียกเข้าแบบมือถือจริง: วงคลื่นรอบรูปผู้โทร + ปัดเพื่อรับ + ปุ่มตัดสายแดง (Phase 4A)
// ป้าย "การจำลอง" อยู่บนสุดเสมอ (CLAUDE.md ข้อ 7.3)
export function RingingScreen({ scenario, errorMessage, onAnswer, onDecline }: RingingScreenProps) {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col items-center justify-between bg-call px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-center">
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted">{COPY.simulationBadge}</span>

      <div className="flex flex-col items-center gap-5">
        <p className="text-muted motion-safe:animate-pulse">{COPY.incoming}</p>
        <CallerAvatar name={scenario.callerId} ringing />
        <div>
          <h1 className="text-balance text-4xl font-bold leading-tight">{scenario.callerId}</h1>
          <p className="mt-2 text-sm text-muted">{COPY.notInContacts}</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-6">
        {errorMessage && (
          <p role="alert" className="rounded-card bg-danger/15 p-3 text-sm text-danger">
            {errorMessage}
          </p>
        )}
        <SlideToAnswer onAnswer={onAnswer} />
        <button type="button" onClick={onDecline} className="flex flex-col items-center gap-2 text-sm text-muted">
          <span className="flex size-16 items-center justify-center rounded-full bg-danger text-white shadow-lg shadow-danger/40 transition active:scale-95">
            <PhoneIcon hangUp />
          </span>
          {COPY.decline}
        </button>
      </div>
    </main>
  );
}
