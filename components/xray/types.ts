import type { SubmitOutcome } from "@/lib/results/client";
import type { AnalysisResult, AnalyzedTurn, CallSession, LevelSummary, ScoreResult } from "@/lib/types";

// "สัญญา" ระหว่าง logic ของหน้า X-Ray กับหน้าตา (docs/SPEC.md ข้อ 15) — component รับ props ล้วน

export type SubmitStatus = "idle" | "sending" | SubmitOutcome;

export interface ShareResultProps {
  /** false = server ไม่ได้เปิด leaderboard/playtest → ซ่อนทั้งกล่อง */
  enabled: boolean;
  leaderboardStatus: SubmitStatus;
  onSubmitLeaderboard: (nickname: string) => void;
  onViewLeaderboard: () => void;
  /** null = ไม่ได้อยู่ในโหมดทดสอบ */
  playtest: { testerCode: string; round: number; status: SubmitStatus } | null;
}

export interface XRayScreenProps {
  level: LevelSummary;
  session: CallSession;
  analysis: AnalysisResult;
  score: ScoreResult;
  share: ShareResultProps;
  onRetryLevel: () => void;
  onBackToLevels: () => void;
}

export interface PressureChartProps {
  turns: AnalyzedTurn[];
  shouldHangUpAt: number;
  /** null = ไม่ต้องวาดเส้น "คุณวางสาย" (เช่น ไม่รับสาย) */
  hangupT: number | null;
}

export interface XRayTimelineProps {
  turns: AnalyzedTurn[];
  shouldHangUpAt: number;
  hangupT: number | null;
}
