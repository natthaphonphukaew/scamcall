import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "./url";

// Supabase ฝั่ง server ที่อ่าน session ของผู้เล่นจาก cookie (publishable key — ใช้ยืนยันตัวตนเท่านั้น)
// การอ่าน/เขียนข้อมูลเกมใช้ secret key ใน lib/server/db.ts

export async function createServerSupabase(): Promise<SupabaseClient | null> {
  const env = getPublicSupabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component เขียน cookie ไม่ได้ — proxy.ts ต่ออายุ session ให้แล้ว
        }
      },
    },
  });
}

export interface CurrentUser {
  id: string;
  isAnonymous: boolean;
}

/** ผู้เล่นปัจจุบันจาก cookie — getClaims() ตรวจลายเซ็น JWT ก่อนเชื่อ (ห้ามใช้ getSession ตัดสินสิทธิ์) */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, isAnonymous: claims.is_anonymous === true };
}
