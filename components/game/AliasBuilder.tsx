import { ALIAS_IDENTITIES, ALIAS_PREFIXES, ALIAS_SUFFIXES } from "@/lib/game/alias";
import type { AliasParts } from "@/lib/game/types";
import { COPY } from "@/lib/copy";

const SLOTS = [ALIAS_PREFIXES, ALIAS_IDENTITIES, ALIAS_SUFFIXES] as const;

/** ฉายา 3 ช่อง กด 🎲 ทีละช่อง หรือสุ่มใหม่ทั้งหมด — ไม่มีช่องพิมพ์เอง */
export function AliasBuilder({
  parts,
  onReroll,
  onRerollAll,
}: {
  parts: AliasParts;
  onReroll: (slot: 0 | 1 | 2) => void;
  onRerollAll: () => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-sm text-muted">{COPY.aliasLabel}</p>
      <div className="flex flex-wrap gap-2">
        {SLOTS.map((list, slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onReroll(slot as 0 | 1 | 2)}
            // การ์ดโปรไฟล์เป็นสี surface-raised อยู่แล้ว → ชิปใช้สีเข้มกว่า + ขอบ ให้เห็นว่าเป็นปุ่มกดสุ่ม
            className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-lg font-bold ring-1 ring-white/15 transition hover:ring-player/60 active:scale-95"
          >
            {list[parts[slot]]}
            <span aria-hidden className="text-base opacity-70">
              🎲
            </span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onRerollAll} className="self-start text-sm text-muted underline">
        {COPY.rerollAll}
      </button>
    </section>
  );
}
