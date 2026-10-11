"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { COPY, SUBMIT_MESSAGES } from "@/lib/copy";
import type { ShareResultProps, SubmitStatus } from "./types";

function statusText(status: SubmitStatus): string | null {
  if (status === "idle") return null;
  if (status === "sending") return "…";
  return SUBMIT_MESSAGES[status];
}

const PLAYTEST_LABEL: Partial<Record<SubmitStatus, string>> = {
  sending: COPY.playtestSendingLabel,
  sent: COPY.playtestSentLabel,
  duplicate: COPY.playtestSentLabel,
  error: COPY.playtestErrorLabel,
  disabled: SUBMIT_MESSAGES.disabled,
};

/** ส่งคะแนนขึ้น leaderboard + สถานะส่งผลโหมดทดสอบ */
export function ShareResult({
  enabled,
  leaderboardStatus,
  onSubmitLeaderboard,
  onViewLeaderboard,
  playtest,
}: ShareResultProps) {
  const [nickname, setNickname] = useState("");
  if (!enabled) return null;

  const done = leaderboardStatus === "sent" || leaderboardStatus === "duplicate";

  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface-raised p-4">
      {playtest && (
        <p className="text-sm text-player">
          {COPY.playtestActive} {playtest.testerCode} · {COPY.playtestRound} {playtest.round} —{" "}
          {PLAYTEST_LABEL[playtest.status] ?? ""}
        </p>
      )}

      <div>
        <h2 className="font-bold">{COPY.leaderboardTitle}</h2>
        <p className="text-xs text-muted">{COPY.leaderboardHint}</p>
      </div>

      {!done && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (nickname.trim()) onSubmitLeaderboard(nickname);
          }}
        >
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder={COPY.nicknamePlaceholder}
            aria-label={COPY.nicknamePlaceholder}
            className="min-w-0 flex-1 rounded-card bg-surface px-3 py-2 text-text placeholder:text-muted"
          />
          <Button type="submit" variant="accept" disabled={leaderboardStatus === "sending" || nickname.trim().length < 2}>
            {COPY.submitScore}
          </Button>
        </form>
      )}

      {statusText(leaderboardStatus) && (
        <p className={`text-sm ${done ? "text-accept" : "text-muted"}`} aria-live="polite">
          {statusText(leaderboardStatus)}
        </p>
      )}

      <Button onClick={onViewLeaderboard}>{COPY.viewLeaderboard}</Button>
    </section>
  );
}
