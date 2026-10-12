"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import type { SubmitStatus } from "@/components/xray/types";
import { XRayScanner } from "@/components/xray/XRayScanner";
import { XRayScreen } from "@/components/xray/XRayScreen";
import { requestAnalysis } from "@/lib/analysis/client";
import { COPY } from "@/lib/copy";
import type { PlayResponse } from "@/lib/game/api";
import { refreshPlayer, usePlayer } from "@/lib/game/playerStore";
import { saveAnalysis, useStoredCall } from "@/lib/live/sessionStore";
import { usePlaytestMode } from "@/lib/playtest/store";
import { submitPlay, submitPlaytest, type SubmitOutcome } from "@/lib/results/client";
import { computeScore } from "@/lib/scoring";

/** โหลดผลสายจาก sessionStorage → ขอวิเคราะห์ (ครั้งเดียว แล้ว cache) → คิดคะแนน → ส่งให้ XRayScreen */
export default function XRayController({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { ready, session, analysis } = useStoredCall(sessionId);
  const { mode: playtest } = usePlaytestMode();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const requestedAttempt = useRef<number | null>(null);
  const player = usePlayer();
  const [game, setGame] = useState<{ outcome: SubmitOutcome; play: PlayResponse | null } | null>(null);
  const playRequested = useRef(false);
  const [playtestStatus, setPlaytestStatus] = useState<SubmitStatus | null>(null);
  const playtestRequested = useRef(false);
  const signed = analysis?.result ?? null;

  useEffect(() => {
    if (!session || analysis || requestedAttempt.current === attempt) return;
    requestedAttempt.current = attempt;
    requestAnalysis(session)
      .then((res) => saveAnalysis(sessionId, res))
      .catch(() => setFailed(true));
  }, [session, analysis, attempt, sessionId]);

  // โหมดทดสอบ: ส่งผลให้อัตโนมัติหนึ่งครั้ง (ถ้าเคยส่งแล้ว server ตอบ 409 = ถือว่าส่งแล้ว)
  useEffect(() => {
    if (!playtest || !signed || playtestRequested.current) return;
    playtestRequested.current = true;
    void submitPlaytest(playtest.testerCode, playtest.round, signed).then(setPlaytestStatus);
  }, [playtest, signed]);

  // ระบบผู้เล่น: บันทึกผล → XP/เหรียญ (รอ session guest/login พร้อมก่อน) · ซ้ำ = 409 "บันทึกไปแล้ว"
  useEffect(() => {
    if (!signed || player.status !== "ready" || playRequested.current) return;
    playRequested.current = true;
    void submitPlay(signed).then((r) => {
      setGame(r);
      if (r.outcome === "sent") void refreshPlayer();
    });
  }, [signed, player.status]);

  if (!ready) return null;

  if (!session) {
    return (
      <Screen className="justify-center gap-4 text-center">
        <p className="text-muted">{COPY.sessionMissing}</p>
        <Link href="/campus" className="underline">
          {COPY.backToCampus}
        </Link>
      </Screen>
    );
  }

  if (!analysis) {
    if (!failed) return <XRayScanner channel={session.channel ?? "call"} />;
    return (
      <Screen className="items-center justify-center gap-4 text-center">
        <p className="text-danger">{COPY.analyzeFailed}</p>
        <Button
          onClick={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }}
        >
          {COPY.retry}
        </Button>
      </Screen>
    );
  }

  return (
    <XRayScreen
      level={analysis.level}
      session={session}
      analysis={analysis.analysis}
      score={computeScore(session, analysis.analysis)}
      game={{
        status:
          !signed || player.status === "disabled"
            ? "disabled"
            : player.status === "error"
              ? "error"
              : (game?.outcome ?? "sending"),
        play: game?.play ?? null,
        onOpenProfile: () => router.push("/me"),
        onOpenHall: () => router.push("/hall"),
        playtest: playtest ? { ...playtest, status: playtestStatus ?? "sending" } : null,
      }}
      onRetryLevel={() => router.push(`/${session.channel ?? "call"}/${session.levelId}`)}
      onBackToCampus={() => router.push("/campus")}
    />
  );
}
