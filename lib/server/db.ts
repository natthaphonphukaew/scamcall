import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ResultPayload } from "@/lib/types";
import { getSupabaseEnv } from "./env";

// เข้าถึง Supabase ฝั่ง server เท่านั้น ด้วย secret key (ข้าม RLS) — ห้าม import จาก client
// ตาราง: supabase/migrations/001_scamcall.sql

export class DbUnavailableError extends Error {}

let cached: { key: string; client: SupabaseClient } | null = null;

/** client ที่ใช้ secret key — ใช้ใน lib/server/* เท่านั้น */
export function db(): SupabaseClient {
  const env = getSupabaseEnv();
  if (!env) throw new DbUnavailableError("SUPABASE_URL / SUPABASE_SECRET_KEY not set");
  const key = `${env.url}|${env.secretKey}`;
  if (cached?.key !== key) {
    cached = {
      key,
      client: createClient(env.url, env.secretKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }),
    };
  }
  return cached.client;
}

export function isDbConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export type InsertOutcome = "ok" | "duplicate";

const UNIQUE_VIOLATION = "23505";

export async function insert(table: string, row: Record<string, unknown>): Promise<InsertOutcome> {
  const { error } = await db().from(table).insert(row);
  if (!error) return "ok";
  if (error.code === UNIQUE_VIOLATION) return "duplicate";
  throw new Error(`${table} insert failed: ${error.message}`);
}

// ---- playtest ----

export interface PlaytestRun {
  testerCode: string;
  round: number;
  levelId: string;
  endedBy: ResultPayload["endedBy"];
  hangupT: number;
  shouldHangUpAt: number;
  score: number;
  grade: ResultPayload["grade"];
  complied: boolean;
  leakedCount: number;
  createdAt: string;
}

export function insertPlaytestRun(testerCode: string, round: number, r: ResultPayload): Promise<InsertOutcome> {
  return insert("playtest_runs", {
    session_id: r.sessionId,
    tester_code: testerCode,
    round,
    level_id: r.levelId,
    ended_by: r.endedBy,
    hangup_t: r.hangupT,
    should_hang_up_at: r.shouldHangUpAt,
    score: r.score,
    grade: r.grade,
    complied: r.complied,
    leaked_count: r.leakedCount,
  });
}

export async function listPlaytestRuns(): Promise<PlaytestRun[]> {
  const { data, error } = await db()
    .from("playtest_runs")
    .select(
      "tester_code, round, level_id, ended_by, hangup_t, should_hang_up_at, score, grade, complied, leaked_count, created_at",
    )
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) throw new Error(`playtest read failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    testerCode: r.tester_code,
    round: r.round,
    levelId: r.level_id,
    endedBy: r.ended_by,
    hangupT: r.hangup_t,
    shouldHangUpAt: r.should_hang_up_at,
    score: r.score,
    grade: r.grade,
    complied: r.complied,
    leakedCount: r.leaked_count,
    createdAt: r.created_at,
  }));
}
