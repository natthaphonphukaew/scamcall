"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CampusHud } from "@/components/campus/CampusHud";
import { CelebrationToast, LaunchOverlay } from "@/components/campus/CampusOverlays";
import { CampusMap2D } from "@/components/campus/CampusMap2D";
import type { NpcStatus } from "@/components/campus/Npc";
import { StoryCard } from "@/components/campus/StoryCard";
import { CAMPUS } from "@/lib/campus/data";
import { newlySaved, readCelebrated, writeCelebrated } from "@/lib/campus/celebrate";
import { useReducedMotion, useWebGL } from "@/lib/campus/device";
import { LANDMARK_INFO, NPCS } from "@/lib/campus/npcs";
import { HALL_SPOT, NPC_FOCUS, NPC_SPOTS } from "@/lib/campus/spots";
import { COPY } from "@/lib/copy";
import type { LevelStat } from "@/lib/game/boards";
import { usePlayer } from "@/lib/game/playerStore";
import { playSfx } from "@/lib/sfx";
import type { Channel, PublicScenario } from "@/lib/types";

const CELEBRATE_DELAY_MS = 700;
const CELEBRATE_MS = 4000;
const LAUNCH_MS = 750;

// ฉาก 3D โหลดเฉพาะฝั่ง browser และเฉพาะหน้านี้ (three.js ไม่ติดไปกับหน้าอื่น)
const CampusScene = dynamic(() => import("@/components/campus/CampusScene"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function SceneLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-[#cfe8f7]">
      <p className="animate-pulse text-slate-600">{COPY.campusLoading}</p>
    </div>
  );
}

/** แผนที่แคมปัส = หน้าหลักของเกม: เลือกเพื่อน → StoryCard → เข้าสาย/แชท */
export default function CampusController({ levels }: { levels: PublicScenario[] }) {
  const router = useRouter();
  const webgl = useWebGL();
  const reducedMotion = useReducedMotion();
  const { me } = usePlayer();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<LevelStat[]>([]);
  const [cardHeight, setCardHeight] = useState(0);
  const [celebrating, setCelebrating] = useState<string[] | null>(null);
  const [launch, setLaunch] = useState<{ name: string; channel: Channel } | null>(null);

  useEffect(() => {
    void fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : { levels: [] }))
      .then((d: { levels: LevelStat[] }) => setStats(d.levels))
      .catch(() => {});
  }, []);

  const saved = useMemo(() => new Set(me?.stats.savedLevelIds ?? []), [me]);

  // กลับมาแคมปัสหลังช่วยเพื่อนสำเร็จ → ฉลอง (ครั้งเดียวต่อด่าน จำไว้ในเครื่อง)
  useEffect(() => {
    if (!me) return;
    const savedIds = me.stats.savedLevelIds;
    const fresh = newlySaved(savedIds, readCelebrated());
    if (fresh.length === 0) return;
    const names = NPCS.filter((n) => fresh.includes(n.levelId)).map((n) => n.name);
    // จดว่าฉลองแล้วตอนโชว์จริง — ถ้า me อัปเดตก่อนถึงเวลา effect รอบใหม่จะตั้งเวลาฉลองให้ใหม่
    const show = window.setTimeout(() => {
      writeCelebrated(savedIds);
      setCelebrating(names);
      playSfx("success");
    }, CELEBRATE_DELAY_MS);
    const hide = window.setTimeout(() => setCelebrating(null), CELEBRATE_DELAY_MS + CELEBRATE_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [me]);
  const levelById = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels]);
  const statusOf = (levelId: string): NpcStatus =>
    !levelById.has(levelId) ? "soon" : saved.has(levelId) ? "saved" : "danger";

  const npcViews = NPCS.map((n) => ({
    id: n.id,
    name: n.name,
    hook: n.hook,
    position: NPC_SPOTS[n.id],
    focus: NPC_FOCUS[n.id],
    shirt: n.shirt,
    hair: n.hair,
    status: statusOf(n.levelId),
  }));
  const selected = NPCS.find((n) => n.id === selectedId) ?? null;
  const playable = NPCS.filter((n) => levelById.has(n.levelId));
  const savedCount = playable.filter((n) => saved.has(n.levelId)).length;

  const select = (id: string | null) => {
    if (id && id !== selectedId) playSfx("pop");
    setSelectedId(id);
  };

  const startLevel = () => {
    const level = selected ? levelById.get(selected.levelId) : undefined;
    if (!selected || !level || launch) return;
    const href = `/${level.channel}/${level.id}`;
    if (reducedMotion) {
      router.push(href);
      return;
    }
    // ฉากสวมบทสั้นๆ ก่อนเข้าสาย/แชท (โหลดหน้าถัดไปรอระหว่างนี้)
    router.prefetch(href);
    setLaunch({ name: selected.name, channel: level.channel });
    window.setTimeout(() => router.push(href), LAUNCH_MS);
  };
  const openHall = () => router.push("/hall");

  const use2D = webgl === false || reducedMotion;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#cfe8f7]">
      {webgl === null ? (
        <SceneLoading />
      ) : use2D ? (
        <CampusMap2D
          npcs={npcViews.map(({ id, name, position, status }) => ({ id, name, position, status }))}
          hallPosition={HALL_SPOT}
          onSelect={select}
          onOpenHall={openHall}
        />
      ) : (
        <CampusScene
          npcs={npcViews}
          hallPosition={HALL_SPOT}
          selectedId={selectedId}
          bottomInset={selectedId ? cardHeight : 0}
          reducedMotion={reducedMotion}
          onSelect={select}
          onOpenHall={openHall}
        />
      )}

      <CampusHud saved={savedCount} total={playable.length} attribution={CAMPUS.attribution} />

      <StoryCard
        open={selected !== null}
        npc={selected}
        landmark={selected ? LANDMARK_INFO[selected.landmark] : null}
        level={selected ? (levelById.get(selected.levelId) ?? null) : null}
        status={selected ? statusOf(selected.levelId) : "danger"}
        stat={selected ? (stats.find((s) => s.levelId === selected.levelId) ?? null) : null}
        onStart={startLevel}
        onClose={() => setSelectedId(null)}
        onHeightChange={setCardHeight}
      />

      <CelebrationToast names={celebrating} />
      <LaunchOverlay launch={launch} />
    </main>
  );
}
