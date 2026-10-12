import type { ChatStatus } from "@/lib/chat/useChat";
import type { ChatUiMessage } from "@/lib/chat/session";
import type { CallSession } from "@/lib/types";

// "สัญญา" ระหว่าง logic ของแชท (useChat) กับหน้าตา (docs/SPEC.md ข้อ 15) — screen รับ props ล้วน

export interface ChatScreenProps {
  /** ชื่อผู้ติดต่อที่โชว์บนหัวแชท */
  contact: string;
  status: ChatStatus;
  messages: ChatUiMessage[];
  typing: boolean;
  /** รอคำตอบจากคนร้าย — ปิดช่องพิมพ์ */
  awaiting: boolean;
  /** ข้อความที่เหลือก่อนแชทจบอัตโนมัติ */
  remaining: number;
  /** ข้อความ error ภาษาไทย (มีปุ่มลองใหม่) */
  errorMessage: string | null;
  onSend: (text: string) => void;
  onBlock: () => void;
  onRetry: () => void;
}

export interface ChatEndedScreenProps {
  contact: string;
  result: CallSession;
  /** false = ผู้เล่นไม่ยินยอมให้เก็บบทสนทนา (ทำ X-Ray ไม่ได้) */
  saved: boolean;
  onOpenXRay: () => void;
  onRestart: () => void;
  onBackToCampus: () => void;
}
