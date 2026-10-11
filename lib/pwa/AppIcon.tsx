// ไอคอนแอป วาดด้วย JSX → PNG ผ่าน next/og (ไม่ต้องเก็บไฟล์ภาพใน repo)
// รูปโทรศัพท์: Material Icons "call" (Apache-2.0)

const PHONE_PATH =
  "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z";

const SURFACE = "#0b0f14";
const SCAMMER = "#f59e0b";
const DANGER = "#ef4444";

/**
 * @param size ขนาดภาพ (px)
 * @param maskable true = เว้นขอบ ~20% ให้ Android ตัดเป็นวงกลม/สี่เหลี่ยมมนได้โดยไม่แหว่ง
 */
export function AppIcon({ size, maskable = false }: { size: number; maskable?: boolean }) {
  const badge = Math.round(size * (maskable ? 0.56 : 0.78));
  const phone = Math.round(badge * 0.55);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: SURFACE,
        borderRadius: maskable ? 0 : Math.round(size * 0.22),
      }}
    >
      <div
        style={{
          width: badge,
          height: badge,
          borderRadius: badge,
          background: SCAMMER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `${Math.max(2, Math.round(size * 0.025))}px solid ${DANGER}`,
        }}
      >
        <svg width={phone} height={phone} viewBox="0 0 24 24">
          <path d={PHONE_PATH} fill={SURFACE} />
        </svg>
      </div>
    </div>
  );
}
