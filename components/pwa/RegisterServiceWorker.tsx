"use client";

import { useEffect } from "react";

/** ลงทะเบียน /sw.js เฉพาะ production (ตอน dev ไม่ต้องการ — กัน hot reload สับสน) */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // ลงทะเบียนไม่ได้ (เช่น ไม่ใช่ HTTPS) — แอปยังใช้ได้ แค่ติดตั้งเป็นแอปไม่ได้
    });
  }, []);
  return null;
}
