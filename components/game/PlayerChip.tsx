"use client";

import Link from "next/link";
import { AVATARS, formatAlias, isAvatarId } from "@/lib/game/alias";
import { usePlayer } from "@/lib/game/playerStore";

/** ป้ายผู้เล่นมุมจอ (avatar + เลเวล) → ไปหน้าโปรไฟล์ */
export function PlayerChip() {
  const { status, me } = usePlayer();
  if (status !== "ready" || !me) return null;
  const avatar = me.profile && isAvatarId(me.profile.avatar) ? AVATARS[me.profile.avatar] : "👤";
  return (
    <Link
      href="/me"
      className="flex items-center gap-2 rounded-full bg-surface-raised py-1 pl-1 pr-3 text-sm"
      title={me.profile ? formatAlias(me.profile.aliasParts) : undefined}
    >
      <span className="text-xl" aria-hidden>
        {avatar}
      </span>
      Lv.{me.stats.level.level}
    </Link>
  );
}
