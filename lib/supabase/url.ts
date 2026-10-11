/**
 * supabase-js ต้องการแค่ origin ของโปรเจกต์ — ถ้าวาง URL ของ Data API มาทั้งเส้น (…/rest/v1/)
 * client จะต่อ path ซ้ำเป็น /rest/v1/rest/v1/… แล้วได้ 404 จึงตัดส่วนเกินออกให้
 */
export function normalizeSupabaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

/**
 * ค่าที่ browser ใช้ได้ (publishable key — สิทธิ์ต่ำ, RLS บังคับ)
 * ต้องอ้าง process.env.NEXT_PUBLIC_* ตรงๆ แบบนี้ Next ถึงจะฝังค่าตอน build ให้ฝั่ง client
 * null = ยังไม่ได้ตั้ง → ปิดระบบผู้เล่น (แอปส่วนอื่นยังทำงาน)
 */
export function getPublicSupabaseEnv(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url: normalizeSupabaseUrl(url), publishableKey: publishableKey.trim() } : null;
}
