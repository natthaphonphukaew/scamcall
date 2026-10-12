"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CampusHud } from "@/components/campus/CampusHud";
import { CampusMap2D } from "@/components/campus/CampusMap2D";
import type { NpcStatus } from "@/components/campus/Npc";
import { StoryCard } from "@/components/campus/StoryCard";
import { CAMPUS } from "@/lib/campus/data";
import { useReducedMotion, useWebGL } from "@/lib/campus/device";
import { LANDMARK_INFO, NPCS } from "@/lib/campus/npcs";
import { HALL_SPOT, NPC_FOCUS, NPC_SPOTS } from "@/lib/campus/spots";
import { COPY } from "@/lib/copy";
import type { LevelStat } from "@/lib/game/boards";
import { usePlayer } from "@/lib/game/playerStore";
import type { PublicScenario } from "@/lib/types";

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

  useEffect(() => {
    void fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : { levels: [] }))
      .then((d: { levels: LevelStat[] }) => setStats(d.levels))
      .catch(() => {});
  }, []);

  const saved = useMemo(() => new Set(me?.stats.savedLevelIds ?? []), [me]);
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

  const startLevel = () => {
    if (!selected) return;
    // แชท (Phase 3) จะใช้ /chat/[id] — ตอนนี้มีแต่สายโทร
    router.push(`/call/${selected.levelId}`);
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
          onSelect={setSelectedId}
          onOpenHall={openHall}
        />
      ) : (
        <CampusScene
          npcs={npcViews}
          hallPosition={HALL_SPOT}
          selectedId={selectedId}
          bottomInset={selectedId ? cardHeight : 0}
          reducedMotion={reducedMotion}
          onSelect={setSelectedId}
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
    </main>
  );
}
