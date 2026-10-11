import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/pwa/AppIcon";

// ไอคอนสำหรับ manifest: /pwa-icon/192, /pwa-icon/512, /pwa-icon/maskable-512 — สร้างตอน build

const VARIANTS = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "maskable-512": { size: 512, maskable: true },
} as const;

type Variant = keyof typeof VARIANTS;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[variant]">) {
  const { variant } = await ctx.params;
  const v = VARIANTS[variant as Variant];
  if (!v) return new Response("not found", { status: 404 });
  return new ImageResponse(<AppIcon size={v.size} maskable={v.maskable} />, { width: v.size, height: v.size });
}
