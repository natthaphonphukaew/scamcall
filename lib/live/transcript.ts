import { maskSensitive } from "@/lib/privacy/mask";
import type { Speaker, TranscriptTurn } from "@/lib/types";

interface RawTurn {
  id: string;
  t: number;
  speaker: Speaker;
  raw: string;
}

/**
 * รวม transcription ที่ Live API ส่งมาเป็นท่อนๆ (delta) ให้เป็น turn — ดู docs/SPEC.md ข้อ 9
 *
 * - แต่ละฝั่งมี turn ที่ "เปิด" อยู่ได้หนึ่งอัน ท่อนใหม่ของฝั่งนั้นต่อท้าย turn ที่เปิดอยู่
 *   (สองฝั่งส่งสลับกันได้ตอนพูดแทรก — ไม่ทำให้ประโยคแตก)
 * - คนร้ายเริ่ม turn ใหม่ = ผู้เล่นพูดจบแล้ว → ปิด turn ของผู้เล่น
 * - turn ของคนร้ายปิดเมื่อ turnComplete / interrupted (เรียก endScammerTurn)
 * - ข้อความที่ออกไปจาก snapshot() ถูก mask แล้วเสมอ — ค่าจริงอยู่แค่ในหน่วยความจำระหว่างสาย
 */
export class TranscriptBuilder {
  private turns: RawTurn[] = [];
  private open: Record<Speaker, RawTurn | null> = { scammer: null, player: null };

  append(speaker: Speaker, text: string | undefined, t: number): void {
    if (!text) return;
    const current = this.open[speaker];
    if (current) {
      current.raw += text;
      return;
    }
    const turn: RawTurn = { id: String(this.turns.length), t, speaker, raw: text };
    this.turns.push(turn);
    this.open[speaker] = turn;
    if (speaker === "scammer") this.open.player = null;
  }

  endScammerTurn(): void {
    this.open.scammer = null;
  }

  get length(): number {
    return this.turns.length;
  }

  snapshot(): TranscriptTurn[] {
    return this.turns
      .map((r) => {
        const m = maskSensitive(r.raw.trim());
        return { id: r.id, t: Math.round(r.t * 10) / 10, speaker: r.speaker, text: m.text, redactions: m.redactions };
      })
      .filter((turn) => turn.text.length > 0);
  }
}
