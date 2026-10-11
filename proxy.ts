import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/url";

// Next 16 Proxy (เดิมชื่อ middleware) — ต่ออายุ session ของ Supabase Auth ทุก request
// ตามแนวทาง https://supabase.com/docs/guides/auth/server-side/nextjs · ไม่ตั้ง env = ผ่านเฉยๆ

export async function proxy(request: NextRequest) {
  const env = getPublicSupabaseEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  await supabase.auth.getClaims(); // ต่ออายุ token ถ้าใกล้หมด
  return response;
}

export const config = {
  // ข้ามไฟล์ static / ไอคอน / worklet / service worker
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|sw.js|pwa-icon|worklets|.*\\.(?:png|jpg|jpeg|svg|webp|glb|js)$).*)",
  ],
};
