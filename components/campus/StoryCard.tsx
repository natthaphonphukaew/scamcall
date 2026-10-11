"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import type { LevelStat } from "@/lib/game/boards";
import { COPY, DIFFICULTY_LABELS } from "@/lib/copy";
import type { LandmarkInfo, Npc } from "@/lib/campus/npcs";
import type { PublicScenario } from "@/lib/types";
import type { NpcStatus } from "./Npc";

export interface StoryCardProps {
  open: boolean;
  npc: Npc | null;
  landmark: LandmarkInfo | null;
  /** null = ด่านยังไม่มี (เร็วๆ นี้) */
  level: PublicScenario | null;
  status: NpcStatus;
  stat: LevelStat | null;
  onStart: () => void;
  onClose: () => void;
}

/** การ์ดสถานการณ์เมื่อแตะ NPC — เลื่อนขึ้นจากด้านล่างแบบ bottom sheet */
export function StoryCard({ open, npc, landmark, level, status, stat, onStart, onClose }: StoryCardProps) {
  return (
    <AnimatePresence>
      {open && npc && landmark && (
        <motion.section
          key={npc.id}
          role="dialog"
          aria-label={npc.name}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "110%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md rounded-t-3xl bg-surface/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted">
                📍 {landmark.label} · {landmark.ref}
              </p>
              <h2 className="text-xl font-bold">
                {npc.name} <span className="text-sm font-normal text-muted">{npc.role}</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={COPY.close}
              className="rounded-full bg-surface-raised px-3 py-1 text-sm"
            >
              ✕
            </button>
          </div>

          <p className="mb-3 rounded-card bg-surface-raised p-3 font-medium">“{npc.hook}”</p>
          <p className="mb-3 leading-relaxed text-muted">{npc.story}</p>

          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-surface-raised px-2 py-1">
              {npc.channel === "call" ? COPY.channelCall : COPY.channelChat}
            </span>
            {level && (
              <span className="rounded-full bg-surface-raised px-2 py-1 text-scammer">
                {"★".repeat(level.difficulty)}
                {"☆".repeat(3 - level.difficulty)} {DIFFICULTY_LABELS[level.difficulty]}
              </span>
            )}
            {status === "saved" && (
              <span className="rounded-full bg-accept/20 px-2 py-1 text-accept">{COPY.npcSavedChip}</span>
            )}
            {stat && stat.plays > 0 && (
              <span className="rounded-full bg-danger/15 px-2 py-1 text-danger">
                {COPY.statScammed(stat.scammedPercent, stat.plays)}
              </span>
            )}
          </div>

          {level ? (
            <Button variant="accept" className="w-full" onClick={onStart}>
              {npc.channel === "call" ? `📞 ${COPY.becomeNpc(npc.name)}` : `💬 ${COPY.becomeNpc(npc.name)}`}
            </Button>
          ) : (
            <Button className="w-full" disabled>
              {COPY.comingSoon}
            </Button>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
