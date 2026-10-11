import { XpBar } from "@/components/game/XpBar";
import { Button } from "@/components/ui/Button";
import { BADGE_INFO, COPY } from "@/lib/copy";
import type { GameResultProps, SubmitStatus } from "./types";

const PLAYTEST_LABEL: Partial<Record<SubmitStatus, string>> = {
  sending: COPY.playtestSendingLabel,
  sent: COPY.playtestSentLabel,
  duplicate: COPY.playtestSentLabel,
  error: COPY.playtestErrorLabel,
};

/** ผลในระบบเกม: ช่วยเพื่อนสำเร็จไหม + XP + เลเวล + เหรียญใหม่ (Phase 4 ใส่ animation) */
export function GameResult({ status, play, playtest, onOpenProfile, onOpenHall }: GameResultProps) {
  if (status === "disabled" && !playtest) return null;

  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface-raised p-4">
      {playtest && (
        <p className="text-sm text-player">
          {COPY.playtestActive} {playtest.testerCode} · {COPY.playtestRound} {playtest.round} —{" "}
          {PLAYTEST_LABEL[playtest.status] ?? ""}
        </p>
      )}

      {status === "sending" && <p className="animate-pulse text-muted">{COPY.gameSaving}</p>}
      {status === "error" && <p className="text-danger">{COPY.gameError}</p>}
      {status === "duplicate" && <p className="text-muted">{COPY.gameAlready}</p>}

      {play && (
        <>
          <p className={`text-lg font-bold ${play.saved ? "text-accept" : "text-scammer"}`}>
            {play.saved ? COPY.npcSaved : COPY.npcNotSaved}
          </p>

          <div>
            <p className="text-sm text-muted">{COPY.xpGained}</p>
            <p className="text-4xl font-bold">+{play.xp.xp} XP</p>
            <ul className="mt-1 text-sm text-muted">
              {play.xp.breakdown.map((b) => (
                <li key={b.label} className="flex justify-between gap-3">
                  <span>{b.label}</span>
                  {b.xp > 0 && <span className="tabular-nums">+{b.xp}</span>}
                </li>
              ))}
            </ul>
          </div>

          {play.after.level > play.before.level && (
            <p className="rounded-card bg-accept/20 p-3 text-center font-bold text-accept">
              🎉 {COPY.levelUp} Lv.{play.after.level} · {play.after.title}
            </p>
          )}
          <XpBar level={play.after} />

          {play.newBadges.length > 0 && (
            <div>
              <p className="text-sm text-muted">{COPY.newBadges}</p>
              <ul className="flex flex-wrap gap-2">
                {play.newBadges.map((id) => (
                  <li key={id} className="rounded-full bg-surface px-3 py-1">
                    {BADGE_INFO[id].emoji} {BADGE_INFO[id].name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {status !== "disabled" && (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onOpenProfile}>
            {COPY.viewProfile}
          </Button>
          <Button className="flex-1" onClick={onOpenHall}>
            {COPY.viewHall}
          </Button>
        </div>
      )}
    </section>
  );
}
