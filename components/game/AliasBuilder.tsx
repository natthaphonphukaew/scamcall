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
            className="rounded-full bg-surface-raised px-4 py-2 text-lg font-bold transition active:scale-95"
          >
            {list[parts[slot]]} <span aria-hidden>🎲</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onRerollAll} className="self-start text-sm text-muted underline">
        {COPY.rerollAll}
      </button>
    </section>
  );
}
