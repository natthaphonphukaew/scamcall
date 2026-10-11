import { connection } from "next/server";
import { playtestCsv } from "@/lib/playtest/summary";
import { DbUnavailableError, listPlaytestRuns } from "@/lib/server/db";
import { errorResponse } from "@/lib/server/http";

// GET /api/playtest/export — ดาวน์โหลดผลทดสอบทั้งหมดเป็น CSV (ไว้ทำกราฟในรายงาน)
// ข้อมูลเป็นรหัสผู้ทดสอบ + ตัวเลขเท่านั้น

export async function GET() {
  // ต้องอยู่นอก try: Cache Components หยุด prerender ด้วยการ throw — ถ้า catch ไว้จะได้ response ค้างตั้งแต่ build
  await connection();
  try {
    const csv = playtestCsv(await listPlaytestRuns());
    const date = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="scamcall-playtest-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof DbUnavailableError) return errorResponse(503, "storage_disabled");
    console.error("[api/playtest/export] failed:", e instanceof Error ? e.message : e);
    return errorResponse(502, "storage_failed");
  }
}
