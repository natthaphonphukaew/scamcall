"use client";

import { useState } from "react";
import { COPY } from "@/lib/copy";
import type { ChatProp } from "@/lib/types";

// การ์ดที่คนร้ายส่งมาในแชท — วาดเองทั้งหมด ไม่มีโลโก้ธนาคาร/แอปจริง และมีป้าย "ภาพจำลองในเกม" เสมอ

function Watermark() {
  return <p className="mt-2 text-[10px] uppercase tracking-wide text-muted/80">{COPY.chatPropWatermark}</p>;
}

function LinkCard({ title, domain }: { title: string; domain: string }) {
  const [warned, setWarned] = useState(false);
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center gap-3 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xl">🔗</span>
        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>
          <p className="truncate text-xs text-muted">{domain}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setWarned(true)}
        className="w-full border-t border-white/10 py-2 text-sm font-medium text-player"
      >
        {COPY.chatLinkOpen}
      </button>
      {warned && <p className="bg-danger/15 px-3 py-2 text-xs text-danger">{COPY.chatLinkWarning}</p>}
    </div>
  );
}

function ProfitCard({ title, percent }: { title: string; percent: number }) {
  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-xs text-muted">📈 {title}</p>
      <p className="text-3xl font-bold text-accept">+{percent}%</p>
      <svg viewBox="0 0 120 36" className="mt-1 h-9 w-full" aria-hidden>
        <polyline
          points="0,32 15,30 30,26 45,28 60,18 75,20 90,10 105,8 120,2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-accept"
        />
      </svg>
      <Watermark />
    </div>
  );
}

function SlipCard({ amount, note }: { amount: number; note: string }) {
  return (
    <div className="mt-2 rounded-xl border border-dashed border-white/20 bg-black/30 p-3 text-center">
      <p className="text-sm font-medium text-accept">✅ {COPY.chatSlipTitle}</p>
      <p className="text-2xl font-bold">฿{amount.toLocaleString("th-TH")}</p>
      <p className="text-xs text-muted">{note}</p>
      <Watermark />
    </div>
  );
}

export function PropCard({ prop }: { prop: ChatProp }) {
  switch (prop.kind) {
    case "link":
      return <LinkCard title={prop.title} domain={prop.domain} />;
    case "profit":
      return <ProfitCard title={prop.title} percent={prop.percent} />;
    case "slip":
      return <SlipCard amount={prop.amount} note={prop.note} />;
  }
}
