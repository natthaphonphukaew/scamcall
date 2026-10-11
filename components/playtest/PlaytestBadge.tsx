"use client";

import Link from "next/link";
import { COPY } from "@/lib/copy";
import { usePlaytestMode } from "@/lib/playtest/store";

/** ป้ายเตือนว่าเครื่องนี้อยู่ในโหมดทดสอบ (ผลจะถูกส่งเข้า playtest) */
export function PlaytestBadge() {
  const { mode } = usePlaytestMode();
  if (!mode) return null;
  return (
    <Link href="/playtest" className="self-start rounded-full bg-surface-raised px-3 py-1 text-xs text-player">
      {COPY.playtestActive} {mode.testerCode} · {COPY.playtestRound} {mode.round}
    </Link>
  );
}
