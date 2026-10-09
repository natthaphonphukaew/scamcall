// ใช้ร่วมกันทั้ง server (สร้าง token) และ browser (เชื่อมต่อ)

/**
 * SDK @google/genai 2.28 รองรับ ephemeral token เฉพาะ v1alpha (จะ warn ถ้าใช้รุ่นอื่น)
 * แม้หน้า docs จะเขียนว่า v1beta — ยึดตาม SDK ที่ติดตั้งจริง ถ้าอัปเกรด SDK ให้เช็กใหม่
 */
export const LIVE_API_VERSION = "v1alpha";

/** ข้อความที่ browser ส่งหลังเชื่อมต่อ เพื่อให้ AI พูด openingLine ก่อน (system prompt อ้างถึงข้อความนี้) */
export const CALL_ANSWERED_CUE = "(ผู้ใช้รับสายแล้ว)";

/** คำที่ผู้เล่นพูดเพื่อหยุดการจำลองทันที — แสดงบนหน้าจอ และ system prompt สั่งให้ AI หลุดบทเมื่อได้ยิน */
export const SAFE_WORD = "หยุดการจำลอง";

export const DEFAULT_VOICE = "Orus";
export const DEFAULT_MAX_CALL_SECONDS = 180;

/** เวลาที่ browser ต้องเริ่ม session หลังได้ token */
export const NEW_SESSION_WINDOW_SECONDS = 60;

/** เผื่อเวลาเชื่อมต่อ/ดีเลย์ ก่อน server ตัด session (hard stop สำรอง) */
export const TOKEN_GRACE_SECONDS = 60;
