"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MAX_CHAT_MESSAGES } from "./constants";
import { ChatController, INITIAL_CHAT_STATE, type ChatState } from "./ChatController";
import type { ChatIntro } from "@/lib/types";

export type { ChatErrorCode, ChatStatus } from "./ChatController";

export interface Chat extends ChatState {
  /** ข้อความที่เหลือก่อนแชทจบอัตโนมัติ */
  remaining: number;
  send: (text: string) => void;
  block: () => void;
  retry: () => void;
}

const getServerSnapshot = () => INITIAL_CHAT_STATE;

/** ตัวเชื่อม React ↔ ChatController — เริ่มแชททันทีที่ mount (docs/SPEC.md ข้อ 15) */
export function useChat(levelId: string, intro: ChatIntro, canSaveTranscript?: () => boolean): Chat {
  const [controller] = useState(() => new ChatController(levelId, intro, canSaveTranscript));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, getServerSnapshot);

  useEffect(() => {
    controller.start();
    return controller.dispose;
  }, [controller]);

  return {
    ...state,
    remaining: Math.max(0, MAX_CHAT_MESSAGES - state.messages.length),
    send: controller.send,
    block: controller.block,
    retry: controller.retry,
  };
}
