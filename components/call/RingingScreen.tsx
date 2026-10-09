import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COPY } from "@/lib/copy";
import type { RingingScreenProps } from "./types";

// Week 1: โครงเรียบ — Week 2 ทำหน้าสายเรียกเข้าเหมือนจริง + ringtone
export function RingingScreen({ scenario, errorMessage, onAnswer, onDecline }: RingingScreenProps) {
  return (
    <Screen className="items-center justify-between text-center">
      <span className="rounded-full bg-surface-raised px-3 py-1 text-xs text-muted">{COPY.simulationBadge}</span>

      <div className="flex flex-col items-center gap-3">
        <div className="size-24 animate-pulse rounded-full bg-surface-raised" aria-hidden />
        <p className="text-muted">{COPY.incoming}</p>
        <h1 className="text-3xl font-bold">{scenario.callerId}</h1>
      </div>

      <div className="flex w-full flex-col items-center gap-6">
        {errorMessage && (
          <p role="alert" className="rounded-card bg-surface-raised p-3 text-sm text-danger">
            {errorMessage}
          </p>
        )}
        <div className="flex w-full justify-around">
          <Button variant="danger" round onClick={onDecline}>
            {COPY.decline}
          </Button>
          <Button variant="accept" round onClick={onAnswer}>
            {COPY.answer}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
