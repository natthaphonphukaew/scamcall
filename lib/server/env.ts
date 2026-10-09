import { DEFAULT_MAX_CALL_SECONDS, DEFAULT_VOICE } from "@/lib/live/constants";

export interface ServerEnv {
  apiKey: string;
  liveModel: string;
  voice: string;
  maxCallSeconds: number;
}

export class EnvError extends Error {}

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
