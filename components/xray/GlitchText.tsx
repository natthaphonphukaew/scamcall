/** ข้อความ glitch แบบสีแยก (ฟ้า/แดง) — สำหรับป้าย "SCAMMED" · ปิดเองเมื่อ reduced motion */
export function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span aria-hidden className="absolute inset-0 text-player motion-safe:animate-glitch-a">
        {text}
      </span>
      <span aria-hidden className="absolute inset-0 text-danger motion-safe:animate-glitch-b">
        {text}
      </span>
    </span>
  );
}
