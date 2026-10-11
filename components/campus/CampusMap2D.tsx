import { CAMPUS, type Pt } from "@/lib/campus/data";
import { bounds, centroid } from "@/lib/campus/geometry";
import type { NpcStatus } from "./Npc";

// แผนที่ 2D สำรอง (ไม่มี WebGL / เปิดโหมดลดการเคลื่อนไหว) — ข้อมูลชุดเดียวกับฉาก 3D
// วาดแบบผังแม่บท: ทิศเหนืออยู่บน

export interface Map2DNpc {
  id: string;
  name: string;
  position: Pt;
  status: NpcStatus;
}

const AREA_FILL = { water: "#5fb6e8", park: "#9fd38a", pitch: "#6cc05a", track: "#c96f52" } as const;
const STATUS_FILL: Record<NpcStatus, string> = { danger: "#ef4444", saved: "#22c55e", soon: "#94a3b8" };

const pts = (p: Pt[]) => p.map(([x, z]) => `${x},${z}`).join(" ");

export function CampusMap2D({
  npcs,
  hallPosition,
  onSelect,
  onOpenHall,
}: {
  npcs: Map2DNpc[];
  hallPosition: Pt;
  onSelect: (id: string) => void;
  onOpenHall: () => void;
}) {
  const b = bounds(CAMPUS.boundary);
  const pad = 20;
  return (
    <svg
      viewBox={`${b.minX - pad} ${b.minZ - pad} ${b.maxX - b.minX + pad * 2} ${b.maxZ - b.minZ + pad * 2}`}
      className="h-full w-full bg-[#a9c98f]"
      role="img"
      aria-label="แผนที่ มจธ. บางมด"
    >
      <polygon points={pts(CAMPUS.boundary)} fill="#e9e6dc" />
      {CAMPUS.areas.map((a, i) => (
        <polygon key={i} points={pts(a.pts)} fill={AREA_FILL[a.kind]} />
      ))}
      {CAMPUS.roads.map((r, i) => (
        <polyline
          key={i}
          points={pts(r.pts)}
          fill="none"
          stroke="#c9c6bd"
          strokeWidth={r.width}
          strokeLinecap="round"
        />
      ))}
      {CAMPUS.buildings.map((bd) => (
        <polygon
          key={bd.id}
          points={pts(bd.pts)}
          fill={bd.landmark === "red" ? "#c81e2b" : bd.landmark === "lx" ? "#fde7dc" : "#ffffff"}
          stroke="#9ca3af"
          strokeWidth={1}
        />
      ))}
      <g onClick={onOpenHall} className="cursor-pointer">
        <circle cx={hallPosition[0]} cy={hallPosition[1]} r={12} fill="#facc15" />
        <text x={hallPosition[0]} y={hallPosition[1] + 5} fontSize={14} textAnchor="middle">
          🏆
        </text>
      </g>
      {npcs.map((n) => (
        <g key={n.id} onClick={() => onSelect(n.id)} className="cursor-pointer">
          <circle
            cx={n.position[0]}
            cy={n.position[1]}
            r={12}
            fill={STATUS_FILL[n.status]}
            stroke="#fff"
            strokeWidth={3}
          />
          <text
            x={n.position[0]}
            y={n.position[1] - 18}
            fontSize={14}
            fontWeight={700}
            textAnchor="middle"
            fill="#111827"
          >
            {n.name}
          </text>
        </g>
      ))}
      <text x={centroid(CAMPUS.boundary)[0]} y={b.maxZ + pad - 4} fontSize={10} textAnchor="middle" fill="#334155">
        {CAMPUS.attribution}
      </text>
    </svg>
  );
}
