import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai";
import type { CallSession, EndedBy, LiveTokenResponse, TranscriptTurn } from "@/lib/types";
import { MicDeniedError, MicRecorder, PcmPlayer } from "./audio";
import { CALL_ANSWERED_CUE, LIVE_API_VERSION } from "./constants";
import { arrayBufferToBase64, base64ToPcm16Buffer, INPUT_MIME } from "./pcm";
import { saveCallSession } from "./sessionStore";
import { TranscriptBuilder } from "./transcript";

// Logic ของสายทั้งหมด (ไม่ผูกกับ React) — UI อ่าน state ผ่าน useLiveCall เท่านั้น ดู docs/SPEC.md ข้อ 2.2, 8, 9, 15

export type CallStatus = "ringing" | "connecting" | "in_call" | "ended";

export type CallErrorCode =
  | "mic_denied"
  | "rate_limited"
  | "token_failed"
  | "connect_failed"
  | "disconnected"
  | "backgrounded";

export interface LiveCallState {
  status: CallStatus;
  /** วินาทีตั้งแต่เริ่มคุย (0 ก่อนต่อสายติด) */
  elapsed: number;
  /** เพดานความยาวสาย ได้มาจาก /api/token (null ก่อนรู้) */
  maxCallSeconds: number | null;
  turns: TranscriptTurn[];
  isScammerSpeaking: boolean;
  error: CallErrorCode | null;
  /** ผลสาย มีค่าเมื่อ status = "ended" */
  result: CallSession | null;
}

export const INITIAL_CALL_STATE: LiveCallState = {
  status: "ringing",
  elapsed: 0,
  maxCallSeconds: null,
  turns: [],
  isScammerSpeaking: false,
  error: null,
  result: null,
};

const TICK_MS = 250;
const BACKGROUND_HANGUP_MS = 10_000;

/** ทรัพยากรของสายหนึ่งสาย — สร้างใหม่ทุกครั้งที่รับสาย */
interface Call {
  id: string;
  startedAt: string;
  callStartMs: number | null;
  recorder: MicRecorder | null;
  player: PcmPlayer | null;
  session: Session | null;
  builder: TranscriptBuilder;
  tick: number | null;
  hiddenTimer: number | null;
  onVisibility: (() => void) | null;
  ended: boolean;
  // วัด latency: ผู้เล่นพูดท่อนล่าสุด → เสียงแรกของคำตอบ
  lastInputAt: number | null;
  awaitingReply: boolean;
}

function newCall(): Call {
  return {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    callStartMs: null,
    recorder: null,
    player: null,
    session: null,
    builder: new TranscriptBuilder(),
    tick: null,
    hiddenTimer: null,
    onVisibility: null,
    ended: false,
    lastInputAt: null,
    awaitingReply: false,
  };
}

function release(c: Call): void {
  if (c.tick !== null) clearInterval(c.tick);
  if (c.hiddenTimer !== null) clearTimeout(c.hiddenTimer);
  if (c.onVisibility) document.removeEventListener("visibilitychange", c.onVisibility);
  c.tick = c.hiddenTimer = null;
  c.onVisibility = null;
  c.recorder?.stop();
  c.player?.close();
  try {
    c.session?.close();
  } catch {
    // ปิดซ้ำได้ ไม่เป็นไร
  }
  c.recorder = null;
  c.player = null;
  c.session = null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export class LiveCallController {
  private state: LiveCallState = INITIAL_CALL_STATE;
  private listeners = new Set<() => void>();
  private call: Call | null = null;

  /**
   * @param canSaveTranscript อ่านตอนจบสาย — false = ไม่บันทึกผลลง sessionStorage
   *   (ยังแสดง transcript ในหน้าจบสายได้ เพราะอยู่ในหน่วยความจำ) CLAUDE.md ข้อ 7.5
   */
  constructor(
    private readonly levelId: string,
    private readonly canSaveTranscript: () => boolean = () => false,
  ) {}

  // ---- store (สำหรับ useSyncExternalStore) ----
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): LiveCallState => this.state;

  private set(patch: Partial<LiveCallState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  // ---- actions ----

  /** รับสาย — ต้องเรียกจาก event handler ของการคลิก (user gesture) */
  answer = (): void => {
    if (this.state.status !== "ringing") return;
    const c = newCall();
    this.call = c;
    // AudioContext ต้องสร้างตรงนี้ (ยังอยู่ใน gesture) ก่อน await ใดๆ
    c.recorder = new MicRecorder();
    c.player = new PcmPlayer((speaking) => {
      if (this.call === c) this.set({ isScammerSpeaking: speaking });
    });
    this.set({ ...INITIAL_CALL_STATE, status: "connecting" });
    void this.connect(c);
  };

  /** ตัดสายตั้งแต่ตอนเรียกเข้า = ชนะทันที */
  decline = (): void => {
    if (this.state.status !== "ringing") return;
    const c = newCall();
    this.call = c;
    this.finish(c, "declined");
  };

  /** วางสาย — กดได้ทุก state */
  hangUp = (): void => {
    if (this.state.status === "ringing") return this.decline();
    if (this.call && (this.state.status === "connecting" || this.state.status === "in_call")) {
      this.finish(this.call, "player");
    }
  };

  /** กลับไปหน้าสายเรียกเข้า (ไว้ทดสอบซ้ำ) */
  reset = (): void => {
    if (this.state.status !== "ended") return;
    this.call = null;
    this.set(INITIAL_CALL_STATE);
  };

  /** ปล่อยทรัพยากรเมื่อ component unmount — ไม่บันทึกผล ไม่อัปเดต state */
  dispose = (): void => {
    if (this.call && !this.call.ended) {
      this.call.ended = true;
      release(this.call);
    }
  };

  // ---- internals ----

  private async connect(c: Call): Promise<void> {
    // 1) ไมค์ก่อน — ถ้าไม่อนุญาตจะได้ไม่เปลือง token
    try {
      await c.recorder!.prepare();
    } catch (e) {
      return this.abortToRinging(c, e instanceof MicDeniedError ? "mic_denied" : "connect_failed");
    }
    if (c.ended) return;

    // 2) ขอ token
    let tok: LiveTokenResponse;
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId: this.levelId }),
      });
      if (!res.ok) return this.abortToRinging(c, res.status === 429 ? "rate_limited" : "token_failed");
      tok = (await res.json()) as LiveTokenResponse;
    } catch {
      return this.abortToRinging(c, "token_failed");
    }
    if (c.ended) return;
    this.set({ maxCallSeconds: tok.maxCallSeconds });

    // 3) ต่อ Live API — config จริงถูกล็อกใน token แล้ว ฝั่งนี้ส่งแค่ที่ SDK บังคับ
    try {
      await c.player!.init();
      const ai = new GoogleGenAI({ apiKey: tok.token, httpOptions: { apiVersion: LIVE_API_VERSION } });
      c.session = await ai.live.connect({
        model: tok.model,
        config: { responseModalities: [Modality.AUDIO] },
        callbacks: {
          onmessage: (m) => this.onMessage(c, m),
          onerror: (e) => {
            console.warn("[live] error", e.message);
            if (c.callStartMs !== null) this.finish(c, "error", "disconnected");
          },
          onclose: (e) => {
            if (!c.ended) console.warn("[live] closed by server", e.code, e.reason);
            if (c.callStartMs !== null) this.finish(c, "error", "disconnected");
          },
        },
      });
    } catch (e) {
      console.warn("[live] connect failed", e);
      return this.abortToRinging(c, "connect_failed");
    }
    if (c.ended) {
      release(c);
      return;
    }

    // 4) ต่อสายติด
    c.callStartMs = performance.now();
    this.set({ status: "in_call" });

    c.lastInputAt = performance.now();
    c.awaitingReply = true;
    c.session.sendClientContent({ turns: [{ role: "user", parts: [{ text: CALL_ANSWERED_CUE }] }], turnComplete: true });

    c.recorder!.start((pcm) => {
      if (c.ended || !c.session) return;
      c.session.sendRealtimeInput({ audio: { data: arrayBufferToBase64(pcm), mimeType: INPUT_MIME } });
    });

    const max = tok.maxCallSeconds;
    c.tick = window.setInterval(() => {
      const elapsed = (performance.now() - c.callStartMs!) / 1000;
      if (elapsed >= max) return this.finish(c, "timeout");
      this.set({ elapsed: Math.floor(elapsed) });
    }, TICK_MS);

    c.onVisibility = () => {
      if (document.hidden) {
        c.hiddenTimer = window.setTimeout(() => this.finish(c, "error", "backgrounded"), BACKGROUND_HANGUP_MS);
      } else if (c.hiddenTimer !== null) {
        clearTimeout(c.hiddenTimer);
        c.hiddenTimer = null;
      }
    };
    document.addEventListener("visibilitychange", c.onVisibility);
  }

  private onMessage(c: Call, m: LiveServerMessage): void {
    if (c.ended || c.callStartMs === null) return;
    const sc = m.serverContent;
    if (!sc) return;
    const t = (performance.now() - c.callStartMs) / 1000;

    for (const part of sc.modelTurn?.parts ?? []) {
      if (!part.inlineData?.data) continue;
      if (c.awaitingReply && c.lastInputAt !== null) {
        console.info("[latency] ms", Math.round(performance.now() - c.lastInputAt));
        c.awaitingReply = false;
      }
      c.player?.push(base64ToPcm16Buffer(part.inlineData.data));
    }

    let transcriptChanged = false;
    if (sc.outputTranscription?.text) {
      c.builder.append("scammer", sc.outputTranscription.text, t);
      transcriptChanged = true;
    }
    if (sc.inputTranscription?.text) {
      c.builder.append("player", sc.inputTranscription.text, t);
      c.lastInputAt = performance.now();
      c.awaitingReply = true;
      transcriptChanged = true;
    }
    if (sc.interrupted) c.player?.clear();
    if (sc.interrupted || sc.turnComplete) c.builder.endScammerTurn();

    if (transcriptChanged) this.set({ turns: c.builder.snapshot() });
  }

  /** ต่อสายไม่ติด → กลับไปหน้าเรียกเข้าพร้อม error ให้กดรับใหม่ได้ */
  private abortToRinging(c: Call, error: CallErrorCode): void {
    if (c.ended) return;
    c.ended = true;
    release(c);
    if (this.call !== c) return;
    this.call = null;
    this.set({ ...INITIAL_CALL_STATE, error });
  }

  private finish(c: Call, endedBy: EndedBy, error: CallErrorCode | null = null): void {
    if (c.ended) return;
    c.ended = true;
    const hangupT = c.callStartMs === null ? 0 : round1((performance.now() - c.callStartMs) / 1000);
    release(c);

    const result: CallSession = {
      sessionId: c.id,
      levelId: this.levelId,
      startedAt: c.startedAt,
      endedAt: new Date().toISOString(),
      endedBy,
      hangupT,
      turns: c.builder.snapshot(),
    };
    if (this.canSaveTranscript()) saveCallSession(result);

    if (this.call !== c) return;
    this.set({
      status: "ended",
      elapsed: Math.floor(hangupT),
      turns: result.turns,
      isScammerSpeaking: false,
      error,
      result,
    });
  }
}
