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

/** ช่องทางของด่าน — "chat" มาใน Phase 3 (docs/GAME_SPEC.md ข้อ 10) */
export type Channel = "call" | "chat";

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
  /** ไม่ระบุ = "call" */
  channel?: Channel;
  voice?: string;
  maxSeconds?: number;
  /** แชท: ข้อความแรกที่คนร้ายส่งมาก่อน (ไม่ระบุ = [openingLine]) — callerId ใช้เป็นชื่อผู้ติดต่อ */
  openingMessages?: string[];
  /** แชท: การ์ดประกอบที่คนร้ายส่งได้ในด่านนี้ (ไม่ระบุ = ไม่มี) */
  chatProps?: ChatPropKind[];
}

/** ข้อมูลด่านที่ส่งไป browser ได้ (ไม่มี persona/escalation ที่ใช้สร้างพรอมต์) */
export type PublicScenario = Pick<Scenario, "id" | "title" | "difficulty" | "callerId"> & { channel: Channel };

// ---- แชทจำลอง (docs/GAME_SPEC.md ข้อ 10) ----

/** การ์ดประกอบในแชท — วาดเองทั้งหมด ไม่มีโลโก้ธนาคาร/แอปจริง ลิงก์เป็นโดเมน .example เท่านั้น */
export type ChatPropKind = "link" | "profit" | "slip";

export type ChatProp =
  | { kind: "link"; title: string; domain: string }
  | { kind: "profit"; title: string; percent: number }
  | { kind: "slip"; amount: number; note: string };

export interface ChatMessage {
  speaker: Speaker;
  text: string;
  prop?: ChatProp;
}

/** request ของ POST /api/chat — ประวัติแชททั้งหมด (stateless) */
export interface ChatRequest {
  levelId: string;
  history: ChatMessage[];
  /** true = ผู้เล่นเงียบไปนาน ให้คนร้ายทักซ้ำ */
  nudge?: boolean;
}

/** response ของ POST /api/chat */
export interface ChatResponse {
  messages: { text: string; prop?: ChatProp }[];
}

/** ข้อมูลเปิดแชทที่ส่งไป browser ได้ */
export interface ChatIntro {
  contact: string;
  openingMessages: string[];
}

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
  /** true = ข้อความที่ผู้เล่นกำลังพูด (ยังไม่ใช่ฉบับจริง) — มีเฉพาะตอนแสดงสด ไม่ถูกบันทึก */
  pending?: true;
}

export type EndedBy = "player" | "timeout" | "error" | "declined";

export interface CallSession {
  sessionId: string;
  levelId: string;
  /** ไม่ระบุ = "call" · แชทใช้โครงเดียวกัน (t = วินาทีตั้งแต่เริ่มแชท, endedBy "player" = บล็อก) */
  channel?: Channel;
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

/** ข้อมูลด่านที่หน้า X-Ray ใช้ (มีทางออกที่ถูกต้องสำหรับบทเรียน) */
export type LevelSummary = Pick<Scenario, "id" | "title" | "callerId" | "correctExit">;

/** ผลสายที่ server คิดคะแนนเองแล้ว — ใช้ส่ง leaderboard / playtest */
export interface ResultPayload {
  sessionId: string;
  levelId: string;
  channel: Channel;
  endedBy: EndedBy;
  hangupT: number;
  shouldHangUpAt: number;
  score: number;
  grade: ScoreResult["grade"];
  complied: boolean;
  saidCallback: boolean;
  leakedCount: number;
  /** epoch ms */
  issuedAt: number;
}

/** ResultPayload + HMAC จาก server — browser แก้คะแนนเองไม่ได้ */
export interface SignedResult {
  payload: ResultPayload;
  sig: string;
}

/** response ของ POST /api/analyze */
export interface AnalyzeResponse {
  analysis: AnalysisResult;
  level: LevelSummary;
  /** null = server ไม่ได้ตั้ง RESULT_SIGNING_SECRET (ปิด leaderboard/playtest) */
  result: SignedResult | null;
}

export interface ScoreResult {
  score: number;
  grade: "strong" | "close" | "scammed";
  breakdown: { label: string; delta: number }[];
}
