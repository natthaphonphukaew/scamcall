import type { Difficulty, PublicScenario, Scenario } from "@/lib/types";
import bankAccountHacked from "@/scenarios/bank-account-hacked.json";
import parcelIllegalGoods from "@/scenarios/parcel-illegal-goods.json";
import policeMoneyLaundering from "@/scenarios/police-money-laundering.json";
import revenueTaxRefund from "@/scenarios/revenue-tax-refund.json";

// ด่านทั้งหมด — เพิ่มด่านใหม่: สร้าง scenarios/<id>.json แล้ว import มาใส่ในลิสต์นี้
// ใช้ static import (ไม่อ่านไฟล์ด้วย fs) เพื่อให้ bundle ไปกับ Vercel ได้แน่นอน
const RAW_SCENARIOS: unknown[] = [bankAccountHacked, policeMoneyLaundering, parcelIllegalGoods, revenueTaxRefund];

export class ScenarioError extends Error {}

function fail(id: string, field: string, reason: string): never {
  throw new ScenarioError(`scenario "${id}": ${field} ${reason}`);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isNonEmptyStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every(isNonEmptyString);
}

/** ตรวจ JSON ของด่านตอน runtime — JSON import ไม่การันตี type ให้ */
export function parseScenario(raw: unknown): Scenario {
  if (typeof raw !== "object" || raw === null) {
    throw new ScenarioError("scenario must be an object");
  }
  const r = raw as Record<string, unknown>;
  const id = isNonEmptyString(r.id) ? r.id : fail("?", "id", "must be a non-empty string");

  for (const field of ["title", "archetype", "callerId", "persona", "openingLine", "correctExit"] as const) {
    if (!isNonEmptyString(r[field])) fail(id, field, "must be a non-empty string");
  }
  if (r.difficulty !== 1 && r.difficulty !== 2 && r.difficulty !== 3) {
    fail(id, "difficulty", "must be 1, 2 or 3");
  }
  if (!isNonEmptyStringArray(r.escalationSteps)) fail(id, "escalationSteps", "must be a non-empty string[]");
  if (!isNonEmptyStringArray(r.targetInfo)) fail(id, "targetInfo", "must be a non-empty string[]");

  const profile = r.fakeVictimProfile;
  if (
    typeof profile !== "object" ||
    profile === null ||
    Array.isArray(profile) ||
    !Object.values(profile).every(isNonEmptyString)
  ) {
    fail(id, "fakeVictimProfile", "must be an object of strings");
  }
  if (r.voice !== undefined && !isNonEmptyString(r.voice)) fail(id, "voice", "must be a non-empty string");
  if (r.maxSeconds !== undefined && (typeof r.maxSeconds !== "number" || r.maxSeconds <= 0)) {
    fail(id, "maxSeconds", "must be a positive number");
  }

  return {
    id,
    title: r.title as string,
    difficulty: r.difficulty as Difficulty,
    archetype: r.archetype as string,
    callerId: r.callerId as string,
    persona: r.persona as string,
    openingLine: r.openingLine as string,
    escalationSteps: r.escalationSteps as string[],
    targetInfo: r.targetInfo as string[],
    fakeVictimProfile: profile as Record<string, string>,
    correctExit: r.correctExit as string,
    voice: r.voice as string | undefined,
    maxSeconds: r.maxSeconds as number | undefined,
  };
}

// parse ครั้งเดียวตอนโหลด module — ถ้าไฟล์ด่านผิด build/test จะพังทันที ไม่ใช่ตอนเดโม
const SCENARIOS: ReadonlyMap<string, Scenario> = (() => {
  const map = new Map<string, Scenario>();
  for (const raw of RAW_SCENARIOS) {
    const s = parseScenario(raw);
    if (map.has(s.id)) throw new ScenarioError(`duplicate scenario id "${s.id}"`);
    map.set(s.id, s);
  }
  return map;
})();

export function getScenario(id: string): Scenario | null {
  return SCENARIOS.get(id) ?? null;
}

/** เรียงจากง่ายไปยาก */
export function listScenarios(): Scenario[] {
  return [...SCENARIOS.values()].sort((a, b) => a.difficulty - b.difficulty);
}

export function toPublicScenario(s: Scenario): PublicScenario {
  return { id: s.id, title: s.title, difficulty: s.difficulty, callerId: s.callerId };
}
