"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AliasBuilder } from "@/components/game/AliasBuilder";
import { AvatarPicker } from "@/components/game/AvatarPicker";
import { BadgeGrid } from "@/components/game/BadgeGrid";
import { TitleChips } from "@/components/game/TitleChips";
import { XpBar } from "@/components/game/XpBar";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COPY } from "@/lib/copy";
import { formatAlias, randomAliasParts, rerollAliasPart } from "@/lib/game/alias";
import { linkGoogle, signInWithGoogle, signOut, updateProfile, usePlayer } from "@/lib/game/playerStore";
import type { AliasParts } from "@/lib/game/types";

/** โปรไฟล์ผู้เล่น — ?welcome=1 = สร้างตัวละครครั้งแรกหลังหน้ายินยอม */
export default function MeController({ levelCount }: { levelCount: number }) {
  const params = useSearchParams();
  const welcome = params.get("welcome") === "1";
  const authError = params.get("auth_error");
  const { status, me } = usePlayer();

  // แก้ร่างในหน้าจอก่อน แล้วค่อยกดบันทึก (null = ยังไม่แก้ ใช้ค่าจาก server)
  const [draftAlias, setDraftAlias] = useState<AliasParts | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [initialAlias] = useState<AliasParts>(() => randomAliasParts());
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  if (status === "disabled") {
    return (
      <Screen className="justify-center text-center">
        <p className="text-muted">{COPY.leaderboardDisabled}</p>
      </Screen>
    );
  }
  if (status !== "ready" || !me) {
    return (
      <Screen className="items-center justify-center text-center">
        <p className={status === "error" ? "text-danger" : "animate-pulse text-muted"}>
          {status === "error" ? COPY.playerError : COPY.playerLoading}
        </p>
      </Screen>
    );
  }

  const aliasParts = draftAlias ?? me.profile?.aliasParts ?? initialAlias;
  const avatar = draftAvatar ?? me.profile?.avatar ?? "cat";
  const dirty = !me.profile || draftAlias !== null || draftAvatar !== null;
  const identityExists = authError === "identity_already_exists";

  async function save() {
    setSaving(true);
    const ok = await updateProfile({ aliasParts, avatar });
    setSaving(false);
    if (ok) {
      setDraftAlias(null);
      setDraftAvatar(null);
      setSavedOnce(true);
    }
  }

  return (
    <Screen className="gap-5">
      <header>
        <h1 className="text-2xl font-bold">{welcome && !me.profile ? COPY.welcomeTitle : COPY.meTitle}</h1>
        {welcome && <p className="text-sm text-muted">{COPY.welcomeHint}</p>}
      </header>

      <section className="flex flex-col gap-4 rounded-card bg-surface-raised p-4">
        <p className="text-center text-2xl font-bold">{formatAlias(aliasParts)}</p>
        <AvatarPicker value={avatar} onChange={setDraftAvatar} />
        <AliasBuilder
          parts={aliasParts}
          onReroll={(slot) => setDraftAlias(rerollAliasPart(aliasParts, slot))}
          onRerollAll={() => setDraftAlias(randomAliasParts())}
        />
        <Button variant="accept" onClick={save} disabled={!dirty || saving}>
          {saving ? "…" : !dirty && savedOnce ? COPY.saved : COPY.saveProfile}
        </Button>
      </section>

      {welcome && me.profile && (
        <Link href="/campus" className="rounded-card bg-accept px-5 py-3 text-center font-medium text-white">
          {COPY.goPlay}
        </Link>
      )}

      <section className="flex flex-col gap-3 rounded-card bg-surface-raised p-4">
        <XpBar level={me.stats.level} />
        <p className="text-sm text-muted">
          {COPY.playsCount} {me.stats.plays} · {COPY.savedFriends} {me.stats.savedLevelIds.length}/{levelCount}
        </p>
        <div>
          <p className="mb-1 text-sm text-muted">{COPY.titlesTitle}</p>
          {me.stats.titles.length > 0 ? (
            <TitleChips titles={me.stats.titles} />
          ) : (
            <p className="text-sm text-muted">{COPY.noTitles}</p>
          )}
        </div>
      </section>

      <BadgeGrid owned={me.stats.badges.map((b) => b.id)} />

      {me.profile && (
        <label className="flex items-start gap-3 rounded-card bg-surface-raised p-4">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-accept"
            checked={me.profile.showOnFunnyBoard}
            onChange={(e) => void updateProfile({ showOnFunnyBoard: e.target.checked })}
          />
          <span>
            <span className="font-bold">{COPY.funnyBoardToggle}</span>
            <span className="block text-sm text-muted">{COPY.funnyBoardHint}</span>
          </span>
        </label>
      )}

      <section className="flex flex-col gap-2 rounded-card bg-surface-raised p-4">
        {me.isAnonymous ? (
          <>
            <p className="text-sm text-muted">{COPY.accountGuest}</p>
            {identityExists ? (
              <>
                <p className="text-sm text-danger">{COPY.identityExists}</p>
                <Button variant="outline" onClick={async () => setAccountMessage(await signInWithGoogle())}>{COPY.signInExisting}</Button>
              </>
            ) : (
              <Button variant="outline" onClick={async () => setAccountMessage(await linkGoogle())}>{COPY.linkGoogle}</Button>
            )}
            <p className="text-xs text-muted">{COPY.linkGoogleNote}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-accept">{COPY.accountLinked}</p>
            <Button variant="outline" onClick={() => void signOut()}>{COPY.signOut}</Button>
          </>
        )}
        {(accountMessage || (authError && !identityExists)) && (
          <p className="text-sm text-danger">{COPY.authFailed}</p>
        )}
      </section>

      <nav className="flex justify-between text-sm underline">
        <Link href="/campus">{COPY.backToCampus}</Link>
        <Link href="/hall">{COPY.viewHall}</Link>
      </nav>
    </Screen>
  );
}
