import type { PlayResponse } from "@/lib/game/api";
import type { SubmitOutcome } from "@/lib/results/client";
import type { AnalysisResult, AnalyzedTurn, CallSession, Channel, LevelSummary, ScoreResult } from "@/lib/types";

// "สัญญา" ระหว่าง logic ของหน้า X-Ray กับหน้าตา (docs/SPEC.md ข้อ 15) — component รับ props ล้วน

export type SubmitStatus = "sending" | SubmitOutcome;

export interface GameResultProps {
  /** สถานะบันทึกผลเข้าระบบผู้เล่น (disabled = ไม่ได้ตั้ง Supabase / ไม่ได้เซ็นผล → ซ่อนกล่อง) */
  status: SubmitStatus;
  play: PlayResponse | null;
  /** null = ไม่ได้อยู่ในโหมดทดสอบ */
  playtest: { testerCode: string; round: number; status: SubmitStatus } | null;
  onOpenProfile: () => void;
  onOpenHall: () => void;
}

export interface XRayScreenProps {
  level: LevelSummary;
  session: CallSession;
  analysis: AnalysisResult;
  score: ScoreResult;
  game: GameResultProps;
  onRetryLevel: () => void;
  onBackToCampus: () => void;
}

export interface PressureChartProps {
  /** true = วาดเส้นกราฟค่อยๆ ขึ้นตอนเปิดผล (Phase 4B) */
  play?: boolean;
  turns: AnalyzedTurn[];
  /** แชทใช้คำว่า "บล็อก" แทน "วางสาย" */
  channel: Channel;
  shouldHangUpAt: number;
  /** null = ไม่ต้องวาดเส้น "คุณวางสาย" (เช่น ไม่รับสาย) */
  hangupT: number | null;
}

export interface XRayTimelineProps {
  /** true = ประโยคทยอยขึ้น + ป้ายเทคนิคเด้งทีละอัน (Phase 4B) */
  play?: boolean;
  turns: AnalyzedTurn[];
  channel: Channel;
  shouldHangUpAt: number;
  hangupT: number | null;
}
