"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { LevelUpPopup } from "@/components/game/LevelUpPopup";
import { XpBar } from "@/components/game/XpBar";
import { Button } from "@/components/ui/Button";
import { BADGE_INFO, COPY } from "@/lib/copy";
import { playSfx } from "@/lib/sfx";
import type { GameResultProps, SubmitStatus } from "./types";

const PLAYTEST_LABEL: Partial<Record<SubmitStatus, string>> = {
  sending: COPY.playtestSendingLabel,
  sent: COPY.playtestSentLabel,
  duplicate: COPY.playtestSentLabel,
  error: COPY.playtestErrorLabel,
};

/** เหรียญใหม่เด้งหลังแถบ XP วิ่งเสร็จ */
const BADGES_AT_S = 1.5;

/**
 * ผลในระบบเกม (Phase 4C): XP นับขึ้น → แถบ XP วิ่ง (เลเวลอัป = ป๊อปอัป) → เหรียญใหม่เด้งทีละอัน
 * ผลนี้ได้ครั้งเดียวต่อสาย (ส่งซ้ำ = "บันทึกไปแล้ว") อนิเมชันจึงเล่นครั้งเดียวเอง
 */
export function GameResult({ status, play, playtest, onOpenProfile, onOpenHall }: GameResultProps) {
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const xp = useMotionValue(0);
  const xpText = useTransform(xp, (v) => `+${Math.round(v)} XP`);

  useEffect(() => {
    if (!play) return;
    playSfx("xp");
    const c = animate(xp, play.xp.xp, { duration: 0.9, ease: "easeOut" });
    const badgeTimer = play.newBadges.length
      ? window.setTimeout(() => playSfx("badge"), BADGES_AT_S * 1000)
      : undefined;
    return () => {
      c.stop();
      window.clearTimeout(badgeTimer);
    };
  }, [play, xp]);

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
          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`text-lg font-bold ${play.saved ? "text-accept" : "text-scammer"}`}
          >
            {play.saved ? COPY.npcSaved : COPY.npcNotSaved}
          </motion.p>

          <div>
            <p className="text-sm text-muted">{COPY.xpGained}</p>
            <motion.p className="text-4xl font-bold tabular-nums text-gold">{xpText}</motion.p>
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
            <p className="rounded-card bg-gold/15 p-3 text-center font-bold text-gold">
              🎉 {COPY.levelUp} Lv.{play.after.level} · {play.after.title}
            </p>
          )}
          <XpBar
            level={play.after}
            from={play.before}
            onLevelUp={() => {
              setLevelUpOpen(true);
              playSfx("levelUp");
            }}
          />

          {play.newBadges.length > 0 && (
            <div>
              <p className="text-sm text-muted">{COPY.newBadges}</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {play.newBadges.map((id, i) => (
                  <motion.li
                    key={id}
                    initial={{ scale: 0, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 14, delay: BADGES_AT_S + i * 0.15 }}
                    className="rounded-full bg-gold/15 px-3 py-1 text-gold ring-1 ring-gold/40"
                  >
                    {BADGE_INFO[id].emoji} {BADGE_INFO[id].name}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          <LevelUpPopup level={play.after} open={levelUpOpen} onClose={() => setLevelUpOpen(false)} />
        </>
      )}

      {status !== "disabled" && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onOpenProfile}>
            {COPY.viewProfile}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onOpenHall}>
            {COPY.viewHall}
          </Button>
        </div>
      )}
    </section>
  );
}
