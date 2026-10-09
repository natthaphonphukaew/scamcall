"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { INITIAL_CALL_STATE, LiveCallController, type LiveCallState } from "./LiveCallController";

export type { CallErrorCode, CallStatus } from "./LiveCallController";

export interface LiveCall extends LiveCallState {
  /** วินาทีที่เหลือก่อนตัดสายอัตโนมัติ (null ก่อนรู้เพดาน) */
  remaining: number | null;
  answer: () => void;
  decline: () => void;
  hangUp: () => void;
  reset: () => void;
}

const getServerSnapshot = () => INITIAL_CALL_STATE;

/** ตัวเชื่อม React ↔ LiveCallController — UI ทุกแบบใช้ hook นี้ (docs/SPEC.md ข้อ 15) */
export function useLiveCall(levelId: string): LiveCall {
  const [controller] = useState(() => new LiveCallController(levelId));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, getServerSnapshot);

  useEffect(() => controller.dispose, [controller]);

  const remaining =
    state.maxCallSeconds === null ? null : Math.max(0, state.maxCallSeconds - state.elapsed);

  return {
    ...state,
    remaining,
    answer: controller.answer,
    decline: controller.decline,
    hangUp: controller.hangUp,
    reset: controller.reset,
  };
}
