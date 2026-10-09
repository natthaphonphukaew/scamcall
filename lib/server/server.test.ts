import { afterEach, describe, expect, it, vi } from "vitest";
import { getScenario } from "@/lib/scenarios/load";
import { EnvError, getServerEnv } from "./env";
import { resolveMaxCallSeconds } from "./liveToken";
import { createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows up to the limit per key, then blocks until the window resets", () => {
    let t = 0;
    const take = createRateLimiter(2, 1000, () => t);
    expect(take("a")).toBe(true);
    expect(take("a")).toBe(true);
    expect(take("a")).toBe(false);
    expect(take("b")).toBe(true);
    t = 1000;
    expect(take("a")).toBe(true);
  });
});

describe("getServerEnv", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("throws when the key or model is missing", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_LIVE_MODEL", "m");
    expect(() => getServerEnv()).toThrow(EnvError);
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.stubEnv("GEMINI_LIVE_MODEL", "");
    expect(() => getServerEnv()).toThrow(EnvError);
  });

  it("falls back to defaults for voice and bad MAX_CALL_SECONDS", () => {
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.stubEnv("GEMINI_LIVE_MODEL", "m");
    vi.stubEnv("GEMINI_LIVE_VOICE", "");
    vi.stubEnv("MAX_CALL_SECONDS", "abc");
    expect(getServerEnv()).toMatchObject({ voice: "Orus", maxCallSeconds: 180 });
  });
});

describe("resolveMaxCallSeconds", () => {
  const env = { apiKey: "k", liveModel: "m", voice: "Orus", maxCallSeconds: 60 };
  const police = getScenario("police-money-laundering")!;

  it("uses the env cap when the scenario has none", () => {
    expect(resolveMaxCallSeconds(police, env)).toBe(60);
  });

  it("uses the shorter of scenario and env", () => {
    expect(resolveMaxCallSeconds({ ...police, maxSeconds: 30 }, env)).toBe(30);
    expect(resolveMaxCallSeconds({ ...police, maxSeconds: 300 }, env)).toBe(60);
  });
});
