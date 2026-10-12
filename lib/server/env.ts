import { DEFAULT_MAX_CALL_SECONDS, DEFAULT_VOICE } from "@/lib/live/constants";
import { normalizeSupabaseUrl } from "@/lib/supabase/url";

export interface ServerEnv {
  apiKey: string;
  liveModel: string;
  voice: string;
  maxCallSeconds: number;
}

export class EnvError extends Error {}

export interface AnalysisEnv {
  apiKey: string;
  analysisModel: string;
}

export function getAnalysisEnv(): AnalysisEnv {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const analysisModel = process.env.GEMINI_ANALYSIS_MODEL?.trim();
  if (!apiKey) throw new EnvError("GEMINI_API_KEY is not set");
  if (!analysisModel) throw new EnvError("GEMINI_ANALYSIS_MODEL is not set");
  return { apiKey, analysisModel };
}

export interface ChatEnv {
  apiKey: string;
  chatModel: string;
}

/** แชทจำลองใช้ text model — ไม่ตั้ง GEMINI_CHAT_MODEL = ใช้รุ่นเดียวกับ X-Ray */
export function getChatEnv(): ChatEnv {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const chatModel = (process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_ANALYSIS_MODEL)?.trim();
  if (!apiKey) throw new EnvError("GEMINI_API_KEY is not set");
  if (!chatModel) throw new EnvError("GEMINI_CHAT_MODEL / GEMINI_ANALYSIS_MODEL is not set");
  return { apiKey, chatModel };
}

/** secret สำหรับเซ็นผลสาย — ไม่ตั้ง = ปิด leaderboard/playtest (แอปส่วนอื่นยังทำงาน) */
export function getSigningSecret(): string | null {
  const s = process.env.RESULT_SIGNING_SECRET?.trim();
  return s && s.length >= 32 ? s : null;
}

export interface SupabaseEnv {
  url: string;
  secretKey: string;
}

/** ไม่ตั้ง = ไม่มี database (บอร์ด/playtest ตอบ 503) · ใช้ SUPABASE_URL หรือ NEXT_PUBLIC_SUPABASE_URL ก็ได้ */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  return url && secretKey ? { url: normalizeSupabaseUrl(url), secretKey } : null;
}

/** อ่าน env ฝั่ง server — เรียกในแต่ละ request (ไม่ cache) เพื่อให้แก้ .env.local แล้วมีผลทันทีตอน dev */
export function getServerEnv(): ServerEnv {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const liveModel = process.env.GEMINI_LIVE_MODEL?.trim();
  if (!apiKey) throw new EnvError("GEMINI_API_KEY is not set");
  if (!liveModel) throw new EnvError("GEMINI_LIVE_MODEL is not set");

  const rawMax = Number(process.env.MAX_CALL_SECONDS);
  const maxCallSeconds = Number.isFinite(rawMax) && rawMax > 0 ? Math.floor(rawMax) : DEFAULT_MAX_CALL_SECONDS;

  return {
    apiKey,
    liveModel,
    voice: process.env.GEMINI_LIVE_VOICE?.trim() || DEFAULT_VOICE,
    maxCallSeconds,
  };
}
