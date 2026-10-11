import type { NextRequest } from "next/server";

// helper ที่ทุก API route ใช้ร่วมกัน

export function errorResponse(status: number, code: string): Response {
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
