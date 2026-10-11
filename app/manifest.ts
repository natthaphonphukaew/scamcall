import type { MetadataRoute } from "next";

// Web App Manifest — ทำให้ "เพิ่มลงหน้าจอโฮม" ได้ (CLAUDE.md ข้อ 3: PWA)
// สีอ้างค่าเดียวกับ token ใน app/globals.css (manifest ใช้ CSS variable ไม่ได้)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScamCall — วัคซีนมิจฉาชีพ",
    short_name: "ScamCall",
    description: "ฝึกรับมือแก๊งคอลเซ็นเตอร์ด้วยการจำลองสายโทรศัพท์กับ AI",
    lang: "th",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0f14",
    theme_color: "#0b0f14",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
