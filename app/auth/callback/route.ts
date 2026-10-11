import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /auth/callback — Google OAuth ส่งกลับมาที่นี่ (ทั้ง linkIdentity และ signInWithOAuth)
// แลก code เป็น session แล้วพากลับหน้าเดิม · ต้องใส่ URL นี้ใน Supabase → Auth → URL Configuration → Redirect URLs

function safeNext(raw: string | null): string {
  // กัน open redirect: รับเฉพาะ path ภายในเว็บเรา
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/me";
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const back = (query: string) => NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}${query}`, url.origin));

  // Google นี้ผูกกับบัญชีอื่นอยู่แล้ว หรือผู้ใช้กดยกเลิก → Supabase ส่ง error กลับมา
  const error = url.searchParams.get("error_code") ?? url.searchParams.get("error");
  if (error) return back(`auth_error=${encodeURIComponent(error)}`);

  const code = url.searchParams.get("code");
  if (!code) return back("auth_error=missing_code");

  const supabase = await createServerSupabase();
  if (!supabase) return back("auth_error=disabled");
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return back(`auth_error=${encodeURIComponent(exchangeError.code ?? "exchange_failed")}`);
  return NextResponse.redirect(new URL(next, url.origin));
}
