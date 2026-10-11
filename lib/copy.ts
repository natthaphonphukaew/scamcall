import type { CallErrorCode } from "@/lib/live/LiveCallController";
import { SAFE_WORD } from "@/lib/live/constants";
import type { BadgeId, TitleId } from "@/lib/game/types";
import type { EndedBy, ScoreResult, Speaker, TacticId } from "@/lib/types";

// ข้อความ UI ภาษาไทยที่ใช้ซ้ำ — แก้คำที่นี่ที่เดียว (docs/SPEC.md ข้อ 15)

export const COPY = {
  simulationBadge: "การจำลองเพื่อการฝึก",
  incoming: "สายเรียกเข้า…",
  answer: "รับสาย",
  decline: "ตัดสาย",
  hangUp: "วางสาย",
  connecting: "กำลังเชื่อมต่อ…",
  scammerSpeaking: "ปลายสายกำลังพูด",
  listening: "กำลังฟังคุณ",
  autoHangUpIn: "ตัดสายอัตโนมัติใน",
  safeWordHint: `พูดว่า "${SAFE_WORD}" หรือกดวางสายได้ทุกเมื่อ`,
  transcriptEmpty: "บทสนทนาจะขึ้นตรงนี้",
  speakingNow: "กำลังพูด…",
  ended: "วางสายแล้ว",
  callLength: "ความยาวสาย",
  leaked: "ข้อมูลที่ดูเหมือนข้อมูลจริง (ถูกซ่อนแล้ว)",
  restart: "ลองรับสายใหม่",
  backToLevels: "เลือกด่านอื่น",
  notSaved: "บทสนทนานี้ไม่ได้ถูกบันทึก เพราะคุณไม่ได้ยินยอมให้เก็บ",

  appName: "ScamCall",
  tagline: "วัคซีนมิจฉาชีพ — โดนหลอกแบบปลอดภัย ก่อนเจอของจริง",
  consentTitle: "ก่อนเริ่มฝึก",
  consentAcknowledge:
    "ฉันเข้าใจว่านี่คือการจำลองเพื่อการฝึก ปลายสายคือ AI และเสียงที่พูดจะถูกส่งไปประมวลผลที่ Google",
  consentAdult: "ฉันอายุ 18 ปีขึ้นไป",
  consentSaveTranscript:
    "เก็บบทสนทนา (ที่ซ่อนตัวเลขสำคัญแล้ว) ไว้ในเครื่องนี้ และส่งให้ AI วิเคราะห์เป็น Scam X-Ray หลังวางสาย (ไม่บังคับ)",
  startTraining: "เริ่มฝึก",

  openXRay: "ดู Scam X-Ray",
  xrayTitle: "Scam X-Ray",
  analyzing: "กำลังวิเคราะห์สาย…",
  analyzeFailed: "วิเคราะห์ไม่สำเร็จ (โควตา AI อาจเต็ม)",
  retry: "ลองใหม่",
  sessionMissing: "ไม่พบผลของสายนี้ — อาจปิดแท็บไปแล้ว หรือไม่ได้ยินยอมให้เก็บบทสนทนา",
  scoreTitle: "คะแนน",
  pressureTitle: "ระดับความกดดันตลอดสาย",
  pressureCaption: "0 = คุยทั่วไป · 10 = ขู่ + เร่ง + ขอเงินพร้อมกัน",
  shouldHangUpHere: "ควรวางสายตรงนี้",
  youHungUp: "คุณวางสาย",
  timelineTitle: "ไทม์ไลน์บทสนทนา",
  leakedTitle: "ข้อมูลที่หลุดออกไป",
  noLeaks: "ไม่มีข้อมูลหลุด",
  lessonsTitle: "บทเรียน",
  correctExitTitle: "สิ่งที่ถูกต้องที่สุด",
  pressureLabel: "ความกดดัน",

  leaderboardDisabled: "ยังไม่ได้เปิดใช้ระบบผู้เล่น (ยังไม่ได้ตั้งค่า database)",

  // ---- ผู้เล่น / โปรไฟล์ (docs/GAME_SPEC.md ข้อ 4–7) ----
  meTitle: "โปรไฟล์ของฉัน",
  welcomeTitle: "สร้างตัวละครของคุณ",
  welcomeHint: "ฉายานี้จะแสดงบนบอร์ดแทนชื่อจริง — สุ่มใหม่ได้เรื่อยๆ",
  pickAvatar: "เลือกตัวละคร",
  aliasLabel: "ฉายา",
  rerollAll: "🎲 สุ่มใหม่ทั้งหมด",
  saveProfile: "บันทึก",
  saved: "บันทึกแล้ว",
  goPlay: "ไปช่วยเพื่อนกัน →",
  funnyBoardToggle: "ขึ้นบอร์ดขำ 🤡 ใจดีที่สุดแห่งบางมด",
  funnyBoardHint: "ถ้าเปิด ฉายาของคุณจะติดบอร์ดคนที่ยอมโอนบ่อยที่สุด — แค่ฉายา ไม่มีชื่อจริง ปิดได้ตลอด",
  accountGuest: "ตอนนี้เล่นแบบ guest — ความคืบหน้าอยู่แค่เครื่องนี้ ถ้าล้างข้อมูล browser จะหาย",
  linkGoogle: "เก็บความคืบหน้าด้วย Google",
  linkGoogleNote: "ระบบเก็บอีเมลไว้ยืนยันตัวตนเท่านั้น ไม่แสดงต่อผู้อื่น",
  accountLinked: "เชื่อมกับ Google แล้ว — เล่นต่อได้ทุกเครื่อง",
  signOut: "ออกจากระบบ",
  identityExists: "Google นี้มีบัญชี ScamCall อยู่แล้ว",
  signInExisting: "เข้าบัญชีนั้นแทน (ความคืบหน้า guest บนเครื่องนี้จะไม่ย้าย)",
  authFailed: "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง",
  playerLoading: "กำลังเตรียมตัวละคร…",
  playerError: "เชื่อมต่อระบบผู้เล่นไม่ได้ — ยังเล่นด่านได้ปกติ แต่จะไม่เก็บ XP",
  badgesTitle: "เหรียญ",
  titlesTitle: "ฉายาพฤติกรรม",
  noTitles: "ยังไม่มี — เล่นอีกหน่อยแล้วจะได้ฉายา",
  playsCount: "สายที่เล่น",
  savedFriends: "ช่วยเพื่อนแล้ว",

  // ---- Hall (docs/GAME_SPEC.md ข้อ 8) ----
  hallTitle: "Hall of Bangmod",
  hallHint: "แสดงแค่ฉายา ไม่มีชื่อจริง · อัปเดตทุกครั้งที่เปิดหน้า",
  boardResilient: "🛡️ ภูมิคุ้มกันแกร่ง",
  boardResilientHint: "คะแนนเฉลี่ยสูงสุด (เล่นอย่างน้อย 3 สาย)",
  boardImproved: "📈 พัฒนาขึ้นมากที่สุด",
  boardImprovedHint: "คะแนนดีที่สุด − คะแนนสายแรก",
  boardFunny: "🤡 ใจดีที่สุดแห่งบางมด",
  boardFunnyHint: "ยอมทำตามมิจฉาชีพบ่อยที่สุด — เฉพาะคนที่เปิดสวิตช์ขึ้นบอร์ดขำเอง",
  boardLevels: "📊 สถิติแต่ละด่าน (ทุกคนรวมกัน)",
  boardEmpty: "ยังไม่มีใครติดบอร์ดนี้ — เป็นคนแรกเลย!",
  viewHall: "ดู Hall of Bangmod",
  viewProfile: "โปรไฟล์ของฉัน",

  // ---- ผลการเล่นในหน้า X-Ray ----
  gameSaving: "กำลังบันทึกผล…",
  gameError: "บันทึกผลไม่สำเร็จ (XP ยังไม่เข้า)",
  gameAlready: "สายนี้บันทึกไปแล้ว",
  xpGained: "XP ที่ได้",
  levelUp: "เลเวลอัป!",
  newBadges: "ได้เหรียญใหม่",
  npcSaved: "ช่วยเพื่อนสำเร็จ! ✨",
  npcNotSaved: "เพื่อนยังไม่ปลอดภัย — ลองใหม่ได้เสมอ",

  playtestTitle: "โหมดทดสอบกับเพื่อน",
  playtestHint: "ตั้งรหัสผู้ทดสอบ (เช่น P01 — ไม่ใช่ชื่อจริง) และรอบ ก่อนส่งเครื่องให้เพื่อนเล่น ผลจะถูกส่งให้อัตโนมัติหลังดู X-Ray",
  playtestCode: "รหัสผู้ทดสอบ",
  playtestRound: "รอบ",
  playtestStart: "เริ่มโหมดทดสอบ",
  playtestStop: "ปิดโหมดทดสอบ",
  playtestActive: "โหมดทดสอบ",
  playtestResults: "ผลรอบ 1 vs รอบ 2",
  playtestExport: "ดาวน์โหลด CSV",
  playtestNoRuns: "ยังไม่มีผลทดสอบ",
  playtestSentLabel: "ส่งผลทดสอบแล้ว",
  playtestSendingLabel: "กำลังส่งผลทดสอบ…",
  playtestErrorLabel: "ส่งผลทดสอบไม่สำเร็จ",

  levelsTitle: "เลือกด่าน",
  levelsHint: "แต่ละด่านจำลองรูปแบบการหลอกที่เกิดขึ้นจริง — วางสายให้เร็วที่สุดเมื่อรู้ตัว",
} as const;

/** ข้อความแจ้งก่อนเริ่ม (CLAUDE.md ข้อ 7.3) */
export const DISCLAIMER_POINTS = [
  "นี่คือการจำลองเพื่อการฝึกเท่านั้น ปลายสายคือ AI ที่เล่นบทมิจฉาชีพ",
  "ไม่มีการโทรออกจริง และไม่ต้องใช้ข้อมูลจริงของคุณ — ถ้าต้องตอบ ให้แต่งข้อมูลขึ้นมาเอง",
  `วางสายได้ทุกเมื่อ หรือพูดว่า "${SAFE_WORD}" ถ้ารู้สึกไม่สบายใจ`,
  "แอปนี้ไม่บันทึกเสียงของคุณ แต่เสียงและบทสนทนาถูกส่งไปประมวลผลที่ Google Gemini (บริการฟรี) ซึ่ง Google อาจนำไปใช้ปรับปรุงบริการ และอาจมีเจ้าหน้าที่ตรวจอ่าน — อย่าพูดข้อมูลจริงหรือข้อมูลส่วนตัวใดๆ",
  "ใช้ได้เฉพาะผู้ที่อายุ 18 ปีขึ้นไป (ตามเงื่อนไขของ Gemini API)",
  "ฉายา (ชื่อสุ่ม ไม่ใช่ชื่อจริง) เลเวล และคะแนนของคุณอาจแสดงบนบอร์ดของเกม",
] as const;

export const GRADE_LABELS: Record<ScoreResult["grade"], string> = {
  strong: "ภูมิคุ้มกันแกร่ง",
  close: "รอดแบบเฉียดฉิว",
  scammed: "โดนหลอกแล้ว",
};

/** เหรียญ (docs/GAME_SPEC.md ข้อ 7) */
export const BADGE_INFO: Record<BadgeId, { emoji: string; name: string; how: string }> = {
  first_call: { emoji: "📞", name: "สายแรกในชีวิต", how: "เล่นจบ 1 สาย" },
  quick_cut: { emoji: "⚡", name: "ตัดไวไฟลุก", how: "วางสายภายใน 10 วิหลังจุดอันตราย" },
  tight_lips: { emoji: "🤐", name: "ปากแข็ง", how: "ไม่หลุดข้อมูลเลย 5 สาย" },
  golden_number: { emoji: "☎️", name: "เบอร์ทองคำ", how: "บอกว่าจะโทรกลับเบอร์ทางการ / 1441 ครบ 3 ครั้ง" },
  comeback: { emoji: "🔁", name: "กลับมาแก้มือ", how: "โดนหลอกแล้วกลับมาเล่นด่านเดิมได้ strong" },
  campus_guardian: { emoji: "🏰", name: "ผู้พิทักษ์แคมปัส", how: "ช่วยเพื่อนครบทุกคน" },
  chat_ninja: { emoji: "🥷", name: "นินจาแชท", how: "บล็อกแชทได้ strong 2 ด่าน" },
};

/** ฉายาพฤติกรรม (docs/GAME_SPEC.md ข้อ 6) — ขำได้ แต่ไม่ด่า */
export const TITLE_INFO: Record<TitleId, { emoji: string; name: string }> = {
  iron_wall: { emoji: "🛡️", name: "กำแพงเหล็ก" },
  quick_cutter: { emoji: "⚡", name: "สายตัดไว" },
  bounce_back: { emoji: "📈", name: "ล้มแล้วลุก" },
  too_kind: { emoji: "🤗", name: "ใจดีเกินไป" },
  good_listener: { emoji: "👂", name: "นักฟังตัวยง" },
  gullible: { emoji: "📮", name: "หูเบา" },
};

export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: "ง่าย",
  2: "กลาง",
  3: "ยาก",
};

export const SPEAKER_LABELS: Record<Speaker, string> = {
  scammer: "ปลายสาย",
  player: "คุณ",
};

export const ERROR_MESSAGES: Record<CallErrorCode, string> = {
  mic_denied: "ยังไม่ได้รับสิทธิ์ใช้ไมค์ — กดไอคอนข้างแถบที่อยู่เว็บ อนุญาตไมโครโฟน แล้วกดรับสายอีกครั้ง",
  rate_limited: "ระบบไม่ว่าง ลองใหม่ในอีก 1 นาที",
  token_failed: "ตอนนี้เชื่อมต่อ AI ไม่ได้ (โควตาอาจเต็ม) ลองใหม่อีกครั้ง",
  connect_failed: "ต่อสายไม่ติด ลองใหม่อีกครั้ง",
  disconnected: "สายหลุดกลางทาง",
  backgrounded: "ระบบวางสายให้ เพราะออกจากแอปนานเกิน 10 วินาที",
};

export const ENDED_BY_LABELS: Record<EndedBy, string> = {
  player: "คุณวางสายเอง",
  timeout: "ครบเวลา ระบบตัดสายให้",
  error: "สายถูกตัด",
  declined: "คุณไม่รับสายตั้งแต่แรก — ปลอดภัยที่สุด!",
};

/** ป้ายเทคนิคสำหรับ Scam X-Ray (CLAUDE.md ข้อ 9) */
export const TACTIC_LABELS: Record<TacticId, string> = {
  authority: "อ้างอำนาจ",
  fear: "สร้างความกลัว",
  urgency: "เร่งเวลา",
  isolation: "ตัดขาดจากคนอื่น",
  legitimacy: "สร้างความน่าเชื่อ",
  info_request: "ขอข้อมูล",
  money_request: "ขอให้โอน",
  rapport: "ทำทีเป็นมิตร",
};
