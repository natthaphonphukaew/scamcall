import type { ChatProp } from "@/lib/types";

/** คำอธิบายการ์ดแบบข้อความ — ใช้ในพรอมต์ของคนร้าย และใน transcript ที่ส่งไปทำ Scam X-Ray */
export function describeProp(p: ChatProp): string {
  switch (p.kind) {
    case "link":
      return `[การ์ดลิงก์: ${p.title} (${p.domain})]`;
    case "profit":
      return `[ภาพโชว์กำไร: ${p.title} +${p.percent}%]`;
    case "slip":
      return `[สลิปโอนเงิน: ${p.amount.toLocaleString("th-TH")} บาท — ${p.note}]`;
  }
}
