// AudioWorklet: เล่น PCM16 mono 24kHz ที่ได้จาก Live API (AudioContext ต้องตั้ง sampleRate 24000)
// รับข้อความ { type: "push", buffer } และ { type: "clear" } (ตอนโดนพูดแทรก)
// ส่ง { type: "state", playing } เมื่อเริ่ม/หยุดเล่น — ใช้แสดงว่าคนร้ายกำลังพูด

const IDLE_AFTER_FRAMES = 40; // ~210ms ไม่มีเสียง ถึงจะถือว่าหยุดพูด (กันกระพริบตอน network กระตุก)

class PcmPlayer extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.offset = 0;
    this.playing = false;
    this.silentFrames = 0;
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.type === "push") {
        const i16 = new Int16Array(m.buffer);
        const f32 = new Float32Array(i16.length);
        for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
        this.queue.push(f32);
      } else if (m.type === "clear") {
        this.queue = [];
        this.offset = 0;
      }
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0][0];
    let i = 0;
    while (i < out.length && this.queue.length > 0) {
      const cur = this.queue[0];
      const n = Math.min(out.length - i, cur.length - this.offset);
      out.set(cur.subarray(this.offset, this.offset + n), i);
      i += n;
      this.offset += n;
      if (this.offset >= cur.length) {
        this.queue.shift();
        this.offset = 0;
      }
    }
    if (i < out.length) out.fill(0, i);

    this.silentFrames = i > 0 ? 0 : this.silentFrames + 1;
    const playing = i > 0 || (this.playing && this.silentFrames < IDLE_AFTER_FRAMES);
    if (playing !== this.playing) {
      this.playing = playing;
      this.port.postMessage({ type: "state", playing });
    }
    return true;
  }
}

registerProcessor("pcm-player", PcmPlayer);
