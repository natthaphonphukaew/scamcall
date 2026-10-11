import type { CallSession, PublicScenario, TranscriptTurn } from "@/lib/types";

// "สัญญา" ระหว่าง logic (useLiveCall) กับหน้าตา — ดีไซน์ใหม่ต้องรับ props ชุดนี้ (docs/SPEC.md ข้อ 15)
// screen รับแค่ข้อมูลที่แสดงได้ทันที + callback ห้าม import useLiveCall หรือ lib/live เอง

export interface RingingScreenProps {
  scenario: PublicScenario;
  /** ข้อความ error ภาษาไทย ถ้ารับสายรอบก่อนไม่สำเร็จ */
  errorMessage: string | null;
  onAnswer: () => void;
  onDecline: () => void;
}

export interface InCallScreenProps {
  scenario: PublicScenario;
  phase: "connecting" | "in_call";
  elapsed: number;
  remaining: number | null;
  turns: TranscriptTurn[];
  isScammerSpeaking: boolean;
  onHangUp: () => void;
}

export interface EndedScreenProps {
  scenario: PublicScenario;
  result: CallSession;
  errorMessage: string | null;
  /** false = ผู้เล่นไม่ยินยอมให้เก็บ transcript (แสดงได้ แต่ไม่ได้บันทึก และจะทำ X-Ray ไม่ได้) */
  saved: boolean;
  /** ไปหน้า Scam X-Ray (ใช้ได้เฉพาะเมื่อ saved) */
  onOpenXRay: () => void;
  onRestart: () => void;
  onBackToCampus: () => void;
}
