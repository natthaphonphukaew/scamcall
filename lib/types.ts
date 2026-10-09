// Shared types — ดู docs/SPEC.md ข้อ 4

export type TacticId =
  | "authority"
  | "fear"
  | "urgency"
  | "isolation"
  | "legitimacy"
  | "info_request"
  | "money_request"
  | "rapport";

export type RedactionType =
  | "national_id"
  | "bank_account"
  | "card_number"
  | "otp"
  | "phone";

export type Difficulty = 1 | 2 | 3;

export interface Scenario {
  id: string;
  title: string;
  difficulty: Difficulty;
  archetype: string;
  callerId: string;
  persona: string;
  openingLine: string;
  escalationSteps: string[];
  targetInfo: string[];
  fakeVictimProfile: Record<string, string>;
  correctExit: string;
  voice?: string;
  maxSeconds?: number;
}

/** ข้อมูลด่านที่ส่งไป browser ได้ (ไม่มี persona/escalation ที่ใช้สร้างพรอมต์) */
export type PublicScenario = Pick<Scenario, "id" | "title" | "difficulty" | "callerId">;

/** response ของ POST /api/token */
export interface LiveTokenResponse {
  token: string;
  model: string;
  maxCallSeconds: number;
  expiresAt: string;
}

export type Speaker = "scammer" | "player";

export interface TranscriptTurn {
  id: string;
  t: number;
  speaker: Speaker;
  text: string;
  redactions: RedactionType[];
}

export type EndedBy = "player" | "timeout" | "error" | "declined";

export interface CallSession {
  sessionId: string;
  levelId: string;
  startedAt: string;
  endedAt: string;
  endedBy: EndedBy;
  hangupT: number;
  turns: TranscriptTurn[];
}

export interface AnalyzedTurn {
  t: number;
  speaker: Speaker;
  text: string;
  tactics: TacticId[];
  pressure: number;
}

export interface AnalysisResult {
  turns: AnalyzedTurn[];
  shouldHangUpAt: number;
  leakedInfo: string[];
  complied: boolean;
  saidCallback: boolean;
  summary: string;
  tips: string[];
}

export interface ScoreResult {
  score: number;
  grade: "strong" | "close" | "scammed";
  breakdown: { label: string; delta: number }[];
}
