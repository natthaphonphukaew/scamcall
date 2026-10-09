import { GoogleGenAI, Modality } from "@google/genai";
import {
  LIVE_API_VERSION,
  NEW_SESSION_WINDOW_SECONDS,
  TOKEN_GRACE_SECONDS,
} from "@/lib/live/constants";
import { buildSystemPrompt } from "@/lib/scenarios/buildSystemPrompt";
import type { LiveTokenResponse, Scenario } from "@/lib/types";
import type { ServerEnv } from "./env";

export function resolveMaxCallSeconds(scenario: Scenario, env: ServerEnv): number {
  return Math.min(scenario.maxSeconds ?? Infinity, env.maxCallSeconds);
}

/**
 * ออก ephemeral token ที่ล็อก model + config ทั้งหมด (รวม system prompt) ไว้ฝั่ง server
 * ไม่ตั้ง lockAdditionalFields → ทุก field ใน config ถูกล็อก browser แก้ไม่ได้ (ดู docs/SPEC.md ข้อ 3.1)
 */
export async function createLiveToken(scenario: Scenario, env: ServerEnv): Promise<LiveTokenResponse> {
  const ai = new GoogleGenAI({ apiKey: env.apiKey, httpOptions: { apiVersion: LIVE_API_VERSION } });

  const now = Date.now();
  const maxCallSeconds = resolveMaxCallSeconds(scenario, env);
  const expiresAt = new Date(now + (maxCallSeconds + TOKEN_GRACE_SECONDS) * 1000).toISOString();

  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: expiresAt,
      newSessionExpireTime: new Date(now + NEW_SESSION_WINDOW_SECONDS * 1000).toISOString(),
      liveConnectConstraints: {
        model: env.liveModel,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: buildSystemPrompt(scenario),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: scenario.voice ?? env.voice } },
          },
        },
      },
    },
  });

  if (!token.name) throw new Error("auth token response has no name");
  return { token: token.name, model: env.liveModel, maxCallSeconds, expiresAt };
}
