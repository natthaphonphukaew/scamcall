// ค่าคงที่ของแชทจำลอง — ใช้ทั้ง browser และ server (docs/GAME_SPEC.md ข้อ 10)

/** ข้อความทั้งหมดในแชทหนึ่งรอบ (ทั้งสองฝั่ง) — ครบแล้วจบแชทอัตโนมัติ กันเปลืองโควตา */
export const MAX_CHAT_MESSAGES = 40;
/** ความยาวต่อข้อความของผู้เล่น */
export const MAX_CHAT_CHARS = 500;
/** ความยาวต่อข้อความของคนร้าย (ตัดที่ server) */
export const MAX_SCAMMER_CHARS = 300;
/** คนร้ายทักซ้ำได้กี่ครั้งเมื่อผู้เล่นเงียบ */
export const MAX_NUDGES = 2;
export const NUDGE_AFTER_MS = 30_000;
