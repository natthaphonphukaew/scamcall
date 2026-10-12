import { saveCallSession } from "@/lib/live/sessionStore";
import { maskSensitive } from "@/lib/privacy/mask";
import type { CallSession, ChatIntro, ChatMessage, ChatProp, ChatResponse, EndedBy } from "@/lib/types";
import { MAX_CHAT_CHARS, MAX_CHAT_MESSAGES, MAX_NUDGES, NUDGE_AFTER_MS } from "./constants";
import { chatToSession, typingDelayMs, type ChatUiMessage } from "./session";

// Logic ของแชทจำลองทั้งหมด (ไม่ผูกกับ React) — UI อ่าน state ผ่าน useChat เท่านั้น (docs/SPEC.md ข้อ 15)

/** opening = คนร้ายกำลังส่งข้อความเปิด (ผู้เล่นยังพิมพ์ไม่ได้) */
export type ChatStatus = "opening" | "active" | "ended";
export type ChatErrorCode = "rate_limited" | "send_failed";

export interface ChatState {
  status: ChatStatus;
  messages: ChatUiMessage[];
  /** คนร้ายกำลังพิมพ์ */
  typing: boolean;
  /** รอคำตอบจากคนร้าย — ปิดช่องพิมพ์ชั่วคราว */
  awaiting: boolean;
  error: ChatErrorCode | null;
  /** ผลแชท มีค่าเมื่อ status = "ended" */
  result: CallSession | null;
}

export const INITIAL_CHAT_STATE: ChatState = {
  status: "opening",
  messages: [],
  typing: false,
  awaiting: false,
  error: null,
  result: null,
};

const READ_AFTER_MS = 700;
const GAP_MS = 350;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** ทรัพยากรของแชทหนึ่งรอบ — สร้างใหม่ทุกครั้งที่เริ่ม */
interface Run {
  id: string;
  startedAt: string;
  startMs: number;
  timers: Set<number>;
  abort: AbortController | null;
  nudges: number;
  /** request ล่าสุดเป็นการทักซ้ำหรือไม่ — ใช้ตอนกด "ลองใหม่" */
  lastNudge: boolean;
  ended: boolean;
}

export class ChatController {
  private state: ChatState = INITIAL_CHAT_STATE;
  private listeners = new Set<() => void>();
  private run: Run | null = null;

  constructor(
    private readonly levelId: string,
    private readonly intro: ChatIntro,
    private readonly canSaveTranscript: () => boolean = () => false,
  ) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): ChatState => this.state;

  private set(patch: Partial<ChatState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
  }

  /** เริ่มแชท: คนร้ายส่งข้อความเปิดก่อน (เรียกซ้ำได้ — ถ้าเริ่มแล้วจะไม่ทำอะไร) */
  start = (): void => {
    if (this.run) return;
    const run: Run = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      startMs: performance.now(),
      timers: new Set(),
      abort: null,
      nudges: 0,
      lastNudge: false,
      ended: false,
    };
    this.run = run;
    this.set(INITIAL_CHAT_STATE);
    this.deliver(
      run,
      this.intro.openingMessages.map((text) => ({ text })),
    );
  };

  send = (raw: string): void => {
    const run = this.run;
    const text = raw.trim().slice(0, MAX_CHAT_CHARS);
    if (!run || run.ended || !text || this.state.status !== "active" || this.state.awaiting) return;

    this.clearTimers(run);
    const masked = maskSensitive(text);
    const msg: ChatUiMessage = {
      id: crypto.randomUUID(),
      speaker: "player",
      text: masked.text,
      t: this.elapsed(run),
      redactions: masked.redactions,
    };
    this.set({ messages: [...this.state.messages, msg], awaiting: true, error: null });
    this.later(run, READ_AFTER_MS, () =>
      this.set({ messages: this.state.messages.map((m) => (m.id === msg.id ? { ...m, read: true } : m)) }),
    );
    void this.request(run, false);
  };

  /** บล็อก/รายงาน = วางสาย */
  block = (): void => {
    if (this.run) this.finish(this.run, "player");
  };

  retry = (): void => {
    const run = this.run;
    if (!run || run.ended || this.state.error === null) return;
    this.set({ awaiting: true, error: null });
    void this.request(run, run.lastNudge);
  };

  /** ยกเลิกทุกอย่างแล้วกลับสถานะเริ่มต้น — start() ใหม่ได้ (React StrictMode mount ซ้ำ) */
  dispose = (): void => {
    const run = this.run;
    if (!run) return;
    run.ended = true;
    this.clearTimers(run);
    run.abort?.abort();
    this.run = null;
    this.state = INITIAL_CHAT_STATE;
  };

  // ---- ภายใน ----

  private elapsed(run: Run): number {
    return round1((performance.now() - run.startMs) / 1000);
  }

  private later(run: Run, ms: number, fn: () => void): void {
    const id = window.setTimeout(() => {
      run.timers.delete(id);
      if (!run.ended) fn();
    }, ms);
    run.timers.add(id);
  }

  private clearTimers(run: Run): void {
    for (const id of run.timers) window.clearTimeout(id);
    run.timers.clear();
  }

  private history(): ChatMessage[] {
    return this.state.messages.map((m) => ({ speaker: m.speaker, text: m.text, ...(m.prop ? { prop: m.prop } : {}) }));
  }

  private async request(run: Run, nudge: boolean): Promise<void> {
    run.lastNudge = nudge;
    run.abort = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId: this.levelId, history: this.history(), nudge }),
        signal: run.abort.signal,
      });
      if (run.ended) return;
      if (!res.ok) {
        this.set({ awaiting: false, error: res.status === 429 ? "rate_limited" : "send_failed" });
        return;
      }
      const body = (await res.json()) as ChatResponse;
      if (run.ended) return;
      this.deliver(run, body.messages);
    } catch {
      if (!run.ended) this.set({ awaiting: false, error: "send_failed" });
    }
  }

  /** ส่งข้อความคนร้ายทีละข้อความ พร้อม "กำลังพิมพ์…" */
  private deliver(run: Run, list: { text: string; prop?: ChatProp }[]): void {
    const [next, ...rest] = list;
    if (!next) {
      this.afterDelivery(run);
      return;
    }
    this.set({ typing: true });
    this.later(run, typingDelayMs(next.text, next.prop !== undefined), () => {
      const msg: ChatUiMessage = {
        id: crypto.randomUUID(),
        speaker: "scammer",
        text: next.text,
        ...(next.prop ? { prop: next.prop } : {}),
        t: this.elapsed(run),
        redactions: [],
      };
      this.set({ messages: [...this.state.messages, msg], typing: false });
      if (this.state.messages.length >= MAX_CHAT_MESSAGES) {
        this.finish(run, "timeout");
        return;
      }
      this.later(run, rest.length ? GAP_MS : 0, () => this.deliver(run, rest));
    });
  }

  private afterDelivery(run: Run): void {
    this.set({ status: "active", awaiting: false });
    // ผู้เล่นเงียบ → คนร้ายทักซ้ำ (จำนวนจำกัด) เหมือนแชทหลอกลวงจริงที่ส่งตามไม่หยุด
    if (run.nudges >= MAX_NUDGES) return;
    this.later(run, NUDGE_AFTER_MS, () => {
      const last = this.state.messages.at(-1);
      if (this.state.status !== "active" || this.state.awaiting || last?.speaker !== "scammer") return;
      run.nudges += 1;
      this.set({ awaiting: true });
      void this.request(run, true);
    });
  }

  private finish(run: Run, endedBy: EndedBy): void {
    if (run.ended) return;
    run.ended = true;
    this.clearTimers(run);
    run.abort?.abort();

    const result = chatToSession({
      sessionId: run.id,
      levelId: this.levelId,
      startedAt: run.startedAt,
      endedAt: new Date().toISOString(),
      endedBy,
      hangupT: this.elapsed(run),
      messages: this.state.messages,
    });
    if (this.canSaveTranscript()) saveCallSession(result);
    this.set({ status: "ended", typing: false, awaiting: false, result });
  }
}
