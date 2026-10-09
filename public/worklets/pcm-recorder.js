// AudioWorklet: ไมค์ (sample rate ของเครื่อง เช่น 48k) → PCM16 mono 16kHz เป็นก้อนละ ~40ms
// downsample แบบเฉลี่ยกลุ่ม (box filter) ลด aliasing ได้พอสำหรับเสียงพูด และรองรับ ratio ที่ไม่ลงตัว (44.1k)
// ส่ง ArrayBuffer ของ Int16Array (little-endian) กลับ main thread

const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 640; // 40ms @ 16kHz

class PcmRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_RATE;
    this.pos = 0;
    this.acc = 0;
    this.n = 0;
    this.buf = new Int16Array(CHUNK_SAMPLES);
    this.len = 0;
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;

    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i];
      this.n += 1;
      this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        const s = Math.max(-1, Math.min(1, this.acc / this.n));
        this.acc = 0;
        this.n = 0;
        this.buf[this.len++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this.len === CHUNK_SAMPLES) {
          this.port.postMessage(this.buf.buffer, [this.buf.buffer]);
          this.buf = new Int16Array(CHUNK_SAMPLES);
          this.len = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("pcm-recorder", PcmRecorder);
