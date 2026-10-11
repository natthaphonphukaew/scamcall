import { AVATARS, type AvatarId } from "@/lib/game/alias";
import { COPY } from "@/lib/copy";

/** เลือกตัวละคร (emoji ชั่วคราว — Phase 2 เปลี่ยนเป็นโมเดล chibi โดยใช้ id เดิม) */
export function AvatarPicker({ value, onChange }: { value: string; onChange: (id: AvatarId) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm text-muted">{COPY.pickAvatar}</legend>
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(AVATARS) as AvatarId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={value === id}
            aria-label={id}
            className={`aspect-square rounded-card text-4xl transition active:scale-95 ${
              value === id ? "bg-accept/30 ring-2 ring-accept" : "bg-surface-raised"
            }`}
          >
            {AVATARS[id]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
