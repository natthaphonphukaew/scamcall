"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import type { SubmitStatus } from "@/components/xray/types";
import { XRayScreen } from "@/components/xray/XRayScreen";
import { requestAnalysis } from "@/lib/analysis/client";
import { COPY } from "@/lib/copy";
import { saveAnalysis, useStoredCall } from "@/lib/live/sessionStore";
import { usePlaytestMode } from "@/lib/playtest/store";
import { submitLeaderboard, submitPlaytest } from "@/lib/results/client";
import { computeScore } from "@/lib/scoring";

/** โหลดผลสายจาก sessionStorage → ขอวิเคราะห์ (ครั้งเดียว แล้ว cache) → คิดคะแนน → ส่งให้ XRayScreen */
export default function XRayController({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { ready, session, analysis } = useStoredCall(sessionId);
  const { mode: playtest } = usePlaytestMode();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const requestedAttempt = useRef<number | null>(null);
  const [leaderboardStatus, setLeaderboardStatus] = useState<SubmitStatus>("idle");
  const [playtestStatus, setPlaytestStatus] = useState<SubmitStatus>("idle");
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

  if (!ready) return null;

  if (!session) {
    return (
      <Screen className="justify-center gap-4 text-center">
        <p className="text-muted">{COPY.sessionMissing}</p>
        <Link href="/levels" className="underline">
          {COPY.backToLevels}
        </Link>
      </Screen>
    );
  }

  if (!analysis) {
    return (
      <Screen className="items-center justify-center gap-4 text-center">
        {failed ? (
          <>
            <p className="text-danger">{COPY.analyzeFailed}</p>
            <Button
              onClick={() => {
                setFailed(false);
                setAttempt((a) => a + 1);
              }}
            >
              {COPY.retry}
            </Button>
          </>
        ) : (
          <p className="animate-pulse text-muted">{COPY.analyzing}</p>
        )}
      </Screen>
    );
  }

  return (
    <XRayScreen
      level={analysis.level}
      session={session}
      analysis={analysis.analysis}
      score={computeScore(session, analysis.analysis)}
      share={{
        enabled: signed !== null,
        leaderboardStatus,
        onSubmitLeaderboard: (nickname) => {
          if (!signed) return;
          setLeaderboardStatus("sending");
          void submitLeaderboard(nickname, signed).then(setLeaderboardStatus);
        },
        onViewLeaderboard: () => router.push("/leaderboard"),
        playtest: playtest
          ? { ...playtest, status: playtestStatus === "idle" ? "sending" : playtestStatus }
          : null,
      }}
      onRetryLevel={() => router.push(`/call/${session.levelId}`)}
      onBackToLevels={() => router.push("/levels")}
    />
  );
}
