"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "./url";

// Supabase ฝั่ง browser — ใช้แค่เรื่อง Auth (guest / login Google)
// ข้อมูลเกมทั้งหมดอ่าน/เขียนผ่าน API route ของเรา (ตาราง RLS ไม่มี policy → client อ่านตรงไม่ได้)

let client: SupabaseClient | null | undefined;

/** null = ยังไม่ได้ตั้ง NEXT_PUBLIC_SUPABASE_* */
export function getBrowserSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const env = getPublicSupabaseEnv();
  client = env ? createBrowserClient(env.url, env.publishableKey) : null;
  return client;
}
