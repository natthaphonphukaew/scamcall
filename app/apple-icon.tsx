import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/pwa/AppIcon";

// ไอคอนตอน "เพิ่มลงหน้าจอโฮม" บน iPhone (iOS ไม่อ่านไอคอนจาก manifest)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIcon size={180} maskable />, size);
}
