"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Consent } from "@/lib/consent";
import { COPY, DISCLAIMER_POINTS } from "@/lib/copy";

interface ConsentFormProps {
  /** ค่าเดิม (ถ้าเคยยินยอมแล้ว) */
  initial: Consent | null;
  onSubmit: (consent: Consent) => void;
}

/** ข้อความแจ้ง + ขอความยินยอม ใช้ทั้งหน้าแรกและตอนเปิดลิงก์ด่านตรงๆ */
export function ConsentForm({ initial, onSubmit }: ConsentFormProps) {
  const [acknowledged, setAcknowledged] = useState(initial?.acknowledged ?? false);
  const [saveTranscript, setSaveTranscript] = useState(initial?.saveTranscript ?? true);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (acknowledged) onSubmit({ acknowledged: true, saveTranscript });
      }}
    >
      <h2 className="text-lg font-bold">{COPY.consentTitle}</h2>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
        {DISCLAIMER_POINTS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <label className="flex items-start gap-3 rounded-card bg-surface-raised p-3">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-accept"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          required
        />
        <span>{COPY.consentAcknowledge}</span>
      </label>

      <label className="flex items-start gap-3 rounded-card bg-surface-raised p-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-accept"
          checked={saveTranscript}
          onChange={(e) => setSaveTranscript(e.target.checked)}
        />
        <span>{COPY.consentSaveTranscript}</span>
      </label>

      <Button type="submit" variant="accept" disabled={!acknowledged}>
        {COPY.startTraining}
      </Button>
    </form>
  );
}
