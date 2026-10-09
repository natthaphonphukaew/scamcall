// ห่อ AudioContext + AudioWorklet ของไมค์และลำโพง
// สำคัญ: constructor สร้าง AudioContext ทันที → ต้อง new ภายใน user gesture (คลิก "รับสาย") ไม่งั้น iOS/Chrome ไม่ยอมเล่นเสียง

const RECORDER_URL = "/worklets/pcm-recorder.js";
const PLAYER_URL = "/worklets/pcm-player.js";
export const OUTPUT_SAMPLE_RATE = 24000;

export class MicDeniedError extends Error {}

export class MicRecorder {
  private readonly ctx = new AudioContext();
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;

  /** ขอสิทธิ์ไมค์ + โหลด worklet (ยังไม่ส่งเสียง) — ถ้าผู้ใช้ไม่อนุญาตจะ throw MicDeniedError */
  async prepare(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      throw new MicDeniedError(e instanceof Error ? e.name : "mic_error");
    }
    await this.ctx.audioWorklet.addModule(RECORDER_URL);
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  /** เริ่มส่งก้อน PCM16 16kHz (~40ms) */
  start(onChunk: (pcm16: ArrayBuffer) => void): void {
    if (!this.stream) throw new Error("MicRecorder.prepare() was not called");
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "pcm-recorder");
    this.node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => onChunk(e.data);
    // ต่อลง destination ผ่าน gain 0 เพื่อให้ทุก browser ประมวลผล node นี้แน่นอน โดยไม่ได้ยินเสียงตัวเอง
    const mute = this.ctx.createGain();
    mute.gain.value = 0;
    source.connect(this.node).connect(mute).connect(this.ctx.destination);
  }

  stop(): void {
    this.node?.port.close();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx.close().catch(() => {});
  }
}

export class PcmPlayer {
  private readonly ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
  private node: AudioWorkletNode | null = null;

  constructor(private readonly onSpeakingChange: (speaking: boolean) => void) {}

  async init(): Promise<void> {
    await this.ctx.audioWorklet.addModule(PLAYER_URL);
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.node = new AudioWorkletNode(this.ctx, "pcm-player", { outputChannelCount: [1] });
    this.node.port.onmessage = (e: MessageEvent<{ type: string; playing: boolean }>) => {
      if (e.data.type === "state") this.onSpeakingChange(e.data.playing);
    };
    this.node.connect(this.ctx.destination);
  }

  push(pcm16: ArrayBuffer): void {
    this.node?.port.postMessage({ type: "push", buffer: pcm16 }, [pcm16]);
  }

  /** ล้างเสียงที่ค้างคิว — เรียกเมื่อ server ส่ง interrupted (ผู้เล่นพูดแทรก) */
  clear(): void {
    this.node?.port.postMessage({ type: "clear" });
  }

  close(): void {
    this.node?.port.close();
    void this.ctx.close().catch(() => {});
  }
}
