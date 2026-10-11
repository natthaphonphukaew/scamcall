import { isAvatarId, isValidAliasParts, randomAliasParts } from "@/lib/game/alias";
import type { MeResponse } from "@/lib/game/api";
import type { PlayerProfile } from "@/lib/game/types";
import { isDbConfigured } from "@/lib/server/db";
import { getProfile, listPlays, saveProfile } from "@/lib/server/gameDb";
import { errorResponse } from "@/lib/server/http";
import { buildStats } from "@/lib/server/player";
import { getCurrentUser } from "@/lib/supabase/server";

// GET /api/me — โปรไฟล์ + สถิติของผู้เล่นปัจจุบัน (guest หรือ login)
// PATCH /api/me — แก้ฉายา / avatar / สวิตช์บอร์ดขำ  · ดู docs/GAME_SPEC.md ข้อ 4–8

async function respond(userId: string, isAnonymous: boolean, profile: PlayerProfile | null) {
  const body: MeResponse = { isAnonymous, profile, stats: await buildStats(userId, await listPlays(userId)) };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  if (!isDbConfigured()) return errorResponse(503, "storage_disabled");
  const user = await getCurrentUser();
  if (!user) return errorResponse(401, "no_session");
  try {
    return await respond(user.id, user.isAnonymous, await getProfile(user.id));
  } catch (e) {
    console.error("[api/me] read failed:", e instanceof Error ? e.message : e);
    return errorResponse(502, "storage_failed");
  }
}

export async function PATCH(req: Request) {
  if (!isDbConfigured()) return errorResponse(503, "storage_disabled");
  const user = await getCurrentUser();
  if (!user) return errorResponse(401, "no_session");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
    if (typeof body !== "object" || body === null) throw new SyntaxError("not an object");
  } catch {
    return errorResponse(400, "bad_request");
  }
  if (body.aliasParts !== undefined && !isValidAliasParts(body.aliasParts)) return errorResponse(400, "bad_alias");
  if (body.avatar !== undefined && !isAvatarId(body.avatar)) return errorResponse(400, "bad_avatar");
  if (body.showOnFunnyBoard !== undefined && typeof body.showOnFunnyBoard !== "boolean") {
    return errorResponse(400, "bad_request");
  }

  try {
    const current = (await getProfile(user.id)) ?? { aliasParts: randomAliasParts(), avatar: "cat", showOnFunnyBoard: false };
    const next: PlayerProfile = {
      aliasParts: (body.aliasParts as PlayerProfile["aliasParts"] | undefined) ?? current.aliasParts,
      avatar: (body.avatar as string | undefined) ?? current.avatar,
      showOnFunnyBoard: (body.showOnFunnyBoard as boolean | undefined) ?? current.showOnFunnyBoard,
    };
    await saveProfile(user.id, next);
    return await respond(user.id, user.isAnonymous, next);
  } catch (e) {
    console.error("[api/me] write failed:", e instanceof Error ? e.message : e);
    return errorResponse(502, "storage_failed");
  }
}
