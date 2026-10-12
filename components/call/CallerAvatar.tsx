import { initialOf } from "@/lib/format";

/** รูปผู้โทร + วงคลื่นกระเพื่อมตอนสายเรียกเข้า (ปิดเองเมื่อ reduced motion) */
export function CallerAvatar({ name, ringing = false, size = "size-28" }: { name: string; ringing?: boolean; size?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${size}`}>
      {ringing &&
        [0, 0.8, 1.6].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-player/60 motion-safe:animate-ripple"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      <span className="relative flex size-full items-center justify-center rounded-full bg-gradient-to-b from-white/20 to-white/5 text-5xl font-bold shadow-2xl ring-1 ring-white/15">
        {initialOf(name)}
      </span>
    </div>
  );
}
