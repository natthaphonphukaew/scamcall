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
 *
 * **ข้อความระหว่างพูด (interim)** — Live API ส่ง `interimInputTranscription` ระหว่างผู้เล่นพูด และ
 * `inputTranscription` (ฉบับจริง) ตามมาภายหลัง *แต่บางครั้งฉบับจริงมาช้าหรือไม่มาเลย* (week1-findings)
 * - interim ถือว่าเป็นข้อความสะสมของประโยคที่กำลังพูด (ค่าใหม่แทนค่าเก่า) แสดงเป็น turn `pending`
 * - ฉบับจริงมาเมื่อไร → ทิ้ง interim
 * - คนร้ายพูดจบ (flushInterim) แล้วยังไม่มีฉบับจริง → เก็บ interim เป็น turn ของผู้เล่น (provisional)
 *   ไว้ก่อนประโยคคนร้ายที่ตอบ ถ้าฉบับจริงตามมาก่อนคนร้ายเริ่มประโยคใหม่ จะแทนที่ข้อความ provisional
 */
export class TranscriptBuilder {
  private turns: RawTurn[] = [];
  private open: Record<Speaker, RawTurn | null> = { scammer: null, player: null };
  private nextId = 0;
  private interim: { text: string; t: number } | null = null;
  private provisional: RawTurn | null = null;

  append(speaker: Speaker, text: string | undefined, t: number): void {
    if (!text) return;

    if (speaker === "player") {
      this.interim = null;
      if (this.provisional) {
        // ฉบับจริงของประโยคที่เคยเก็บจาก interim — แทนที่ แล้วให้ท่อนถัดไปต่อท้าย
        this.provisional.raw = text;
        this.open.player = this.provisional;
        this.provisional = null;
        return;
      }
    }

    const current = this.open[speaker];
    if (current) {
      current.raw += text;
      return;
    }
    const turn: RawTurn = { id: String(this.nextId++), t, speaker, raw: text };
    this.turns.push(turn);
    this.open[speaker] = turn;
    if (speaker === "scammer") {
      this.open.player = null;
      this.provisional = null; // คนร้ายเริ่มประโยคใหม่แล้ว — ฉบับจริงที่มาทีหลังถือเป็นประโยคใหม่
    }
  }

  /** ข้อความระหว่างพูดล่าสุดของผู้เล่น (สะสม — ค่าใหม่แทนค่าเก่า) */
  setInterim(text: string | undefined, t: number): void {
    if (!text) return;
    this.interim = { text, t: this.interim?.t ?? t };
  }

  /** เก็บ interim ที่ค้างเป็น turn ของผู้เล่น — เรียกตอนคนร้ายพูดจบ และก่อนจบสาย */
  flushInterim(): void {
    const interim = this.interim;
    this.interim = null;
    if (!interim || !interim.text.trim() || this.open.player) return;

    const turn: RawTurn = { id: String(this.nextId++), t: interim.t, speaker: "player", raw: interim.text };
    // วางก่อนประโยคคนร้ายที่เริ่มหลังจากผู้เล่นเริ่มพูด (= ประโยคที่ตอบ)
    const answerIndex = this.turns.findIndex((x) => x.speaker === "scammer" && x.t >= interim.t);
    if (answerIndex === -1) this.turns.push(turn);
    else this.turns.splice(answerIndex, 0, turn);
    this.provisional = turn;
  }

  endScammerTurn(): void {
    this.open.scammer = null;
  }

  get length(): number {
    return this.turns.length;
  }

  /** @param includeInterim true = ต่อท้ายด้วยข้อความที่ผู้เล่นกำลังพูด (pending) — ใช้แสดงสดเท่านั้น ห้ามบันทึก */
  snapshot({ includeInterim = false }: { includeInterim?: boolean } = {}): TranscriptTurn[] {
    const raws: (RawTurn & { pending?: true })[] = [...this.turns];
    if (includeInterim && this.interim?.text.trim()) {
      raws.push({ id: "interim", t: this.interim.t, speaker: "player", raw: this.interim.text, pending: true });
    }
    return raws
      .map((r) => {
        const m = maskSensitive(r.raw.trim());
        const turn: TranscriptTurn = {
          id: r.id,
          t: Math.round(r.t * 10) / 10,
          speaker: r.speaker,
          text: m.text,
          redactions: m.redactions,
        };
        if (r.pending) turn.pending = true;
        return turn;
      })
      .filter((turn) => turn.text.length > 0);
  }
}
