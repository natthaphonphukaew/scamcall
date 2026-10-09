// แปลง PCM ↔ base64 สำหรับส่ง/รับผ่าน Live API

export const INPUT_MIME = "audio/pcm;rate=16000";

export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000; // กัน call stack ล้นตอน spread array ใหญ่
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/** base64 → ArrayBuffer ที่ความยาวเป็นเลขคู่เสมอ (Int16Array ต้องการ) */
export function base64ToPcm16Buffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const len = bin.length - (bin.length % 2);
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
