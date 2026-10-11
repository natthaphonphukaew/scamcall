"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { MeResponse } from "./api";
import type { PlayerProfile } from "./types";

// สถานะผู้เล่นฝั่ง browser (ใช้ร่วมกันทุกหน้า) — docs/GAME_SPEC.md ข้อ 4
// guest: Supabase anonymous sign-in อัตโนมัติ · login: ผูก Google กับบัญชี guest เดิม (linkIdentity)

export type PlayerStatus = "idle" | "loading" | "ready" | "disabled" | "error";

export interface PlayerState {
  status: PlayerStatus;
  me: MeResponse | null;
}

const INITIAL: PlayerState = { status: "idle", me: null };
let state: PlayerState = INITIAL;
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function set(next: PlayerState) {
  state = next;
  listeners.forEach((l) => l());
}

async function fetchMe(init?: RequestInit): Promise<void> {
  const res = await fetch("/api/me", { cache: "no-store", ...init });
  if (res.status === 503) return set({ status: "disabled", me: null });
  if (!res.ok) return set({ status: "error", me: state.me });
  set({ status: "ready", me: (await res.json()) as MeResponse });
}

/** มี session (สร้าง guest ถ้ายังไม่มี) แล้วโหลดโปรไฟล์ — เรียกซ้ำได้ ไม่ยิงซ้อน */
export function ensurePlayer(): Promise<void> {
  if (state.status === "ready" || state.status === "disabled") return Promise.resolve();
  if (inflight) return inflight;
  inflight = (async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return set({ status: "disabled", me: null });
    set({ status: "loading", me: state.me });
    try {
      // getSession ใช้แค่เช็กว่ามี session ในเครื่องไหม — การตัดสินสิทธิ์จริงทำที่ server ด้วย getClaims()
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }
      await fetchMe();
    } catch (e) {
      console.warn("[player] session failed", e instanceof Error ? e.message : e);
      set({ status: "error", me: null });
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function refreshPlayer(): Promise<void> {
  return fetchMe();
}

export async function updateProfile(patch: Partial<PlayerProfile>): Promise<boolean> {
  const res = await fetch("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return false;
  set({ status: "ready", me: (await res.json()) as MeResponse });
  return true;
}

function callbackUrl(): string {
  return `${window.location.origin}/auth/callback?next=/me`;
}

/** guest → ผูก Google (ความคืบหน้าอยู่ครบ) — browser จะถูกพาไปหน้า Google */
export async function linkGoogle(): Promise<string | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) return "disabled";
  const { error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo: callbackUrl() } });
  return error?.message ?? null;
}

/** เข้าบัญชี Google ที่มีอยู่แล้ว (ความคืบหน้า guest บนเครื่องนี้ไม่ย้าย) */
export async function signInWithGoogle(): Promise<string | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) return "disabled";
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl() } });
  return error?.message ?? null;
}

export async function signOut(): Promise<void> {
  await getBrowserSupabase()?.auth.signOut();
  set(INITIAL);
  await ensurePlayer(); // กลับเป็น guest ใหม่
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** อ่านสถานะผู้เล่น + เริ่ม session ให้อัตโนมัติ */
export function usePlayer(): PlayerState {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => INITIAL);
  useEffect(() => {
    void ensurePlayer();
  }, []);
  return snapshot;
}
