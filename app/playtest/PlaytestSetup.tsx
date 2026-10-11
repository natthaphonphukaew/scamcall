"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { COPY } from "@/lib/copy";
import { setPlaytestMode, usePlaytestMode } from "@/lib/playtest/store";

const CODE_PATTERN = /^[A-Z0-9-]{1,12}$/;

/** ตั้ง/ปิดโหมดทดสอบบนเครื่องนี้ */
export default function PlaytestSetup() {
  const { ready, mode } = usePlaytestMode();
  const [code, setCode] = useState("");
  const [round, setRound] = useState(1);
  if (!ready) return null;

  if (mode) {
    return (
      <section className="flex flex-col gap-3 rounded-card bg-surface-raised p-4">
        <p className="text-lg">
          {COPY.playtestActive}: <strong>{mode.testerCode}</strong> · {COPY.playtestRound} <strong>{mode.round}</strong>
        </p>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => setPlaytestMode({ ...mode, round: Math.min(5, mode.round + 1) })}
            disabled={mode.round >= 5}
          >
            ไปรอบ {Math.min(5, mode.round + 1)}
          </Button>
          <Button className="flex-1" variant="danger" onClick={() => setPlaytestMode(null)}>
            {COPY.playtestStop}
          </Button>
        </div>
        <Link href="/levels" className="rounded-card bg-accept px-5 py-3 text-center font-medium text-white">
          ส่งเครื่องให้ผู้ทดสอบ → เลือกด่าน
        </Link>
      </section>
    );
  }

  const normalized = code.trim().toUpperCase();
  const valid = CODE_PATTERN.test(normalized);

  return (
    <form
      className="flex flex-col gap-3 rounded-card bg-surface-raised p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) setPlaytestMode({ testerCode: normalized, round });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        {COPY.playtestCode}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="P01"
          maxLength={12}
          autoCapitalize="characters"
          className="rounded-card bg-surface px-3 py-2 text-base uppercase text-text placeholder:text-muted"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {COPY.playtestRound}
        <select
          value={round}
          onChange={(e) => setRound(Number(e.target.value))}
          className="rounded-card bg-surface px-3 py-2 text-base text-text"
        >
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="accept" disabled={!valid}>
        {COPY.playtestStart}
      </Button>
    </form>
  );
}
