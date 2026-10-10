// เสียงเรียกเข้า สังเคราะห์ด้วย Web Audio (ไม่ต้องใช้ไฟล์เสียง ไม่ติดลิขสิทธิ์) + สั่น ถ้าเครื่องรองรับ
// จังหวะแบบโทรศัพท์บ้าน: "กริ๊ง-กริ๊ง" (สองช่วง 0.4s) แล้วเงียบ ทุก 3 วินาที

const CYCLE_MS = 3000;
const MAX_RING_MS = 30_000; // ไม่มีใครรับ → หยุดดังเอง (หน้าจอยังรออยู่)
const TONES_HZ = [400, 450];
const VOLUME = 0.12;
const VIBRATE_PATTERN = [400, 200, 400];

export class Ringtone {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private stopTimer: number | null = null;

  start(): void {
    try {
      this.ctx = new AudioContext();
      // ถ้า browser ยังไม่ให้เล่นเสียง (เปิดลิงก์ตรงโดยยังไม่เคยแตะหน้า) จะเงียบ — ไม่ใช่ error
      void this.ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
    }
    this.ring();
    this.timer = window.setInterval(() => this.ring(), CYCLE_MS);
    this.stopTimer = window.setTimeout(() => this.stop(), MAX_RING_MS);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    if (this.stopTimer !== null) clearTimeout(this.stopTimer);
    this.timer = this.stopTimer = null;
    vibrate(0);
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
  }

  private ring(): void {
    vibrate(VIBRATE_PATTERN);
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const t0 = ctx.currentTime;
    for (const offset of [0, 0.6]) this.burst(ctx, t0 + offset, 0.4);
  }

  private burst(ctx: AudioContext, start: number, duration: number): void {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(VOLUME, start + 0.02);
    gain.gain.setValueAtTime(VOLUME, start + duration - 0.03);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    gain.connect(ctx.destination);
    for (const hz of TONES_HZ) {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz;
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + duration);
    }
  }
}

function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // iOS ไม่รองรับ — ข้าม
  }
}
