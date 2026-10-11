import { describe, expect, it } from "vitest";
import { arrayBufferToBase64, base64ToPcm16Buffer } from "./pcm";
import { TranscriptBuilder } from "./transcript";

describe("TranscriptBuilder", () => {
  it("joins deltas of the same speaker into one turn", () => {
    const b = new TranscriptBuilder();
    b.append("scammer", "สวัสดี", 0.2);
    b.append("scammer", "ครับ", 0.6);
    b.endScammerTurn();
    b.append("player", "ใคร", 2.0);
    b.append("player", "ครับ", 2.4);
    expect(b.snapshot()).toEqual([
      { id: "0", t: 0.2, speaker: "scammer", text: "สวัสดีครับ", redactions: [] },
      { id: "1", t: 2, speaker: "player", text: "ใครครับ", redactions: [] },
    ]);
  });

  it("keeps the scammer sentence whole when the player talks over it", () => {
    const b = new TranscriptBuilder();
    b.append("scammer", "บัญชีของคุณ", 1);
    b.append("player", "เดี๋ยว", 1.5);
    b.append("scammer", "ถูกอายัด", 1.6);
    b.endScammerTurn();
    const turns = b.snapshot();
    expect(turns.map((x) => [x.speaker, x.text])).toEqual([
      ["scammer", "บัญชีของคุณถูกอายัด"],
      ["player", "เดี๋ยว"],
    ]);
  });

  it("starts a new player turn after the scammer replies", () => {
    const b = new TranscriptBuilder();
    b.append("player", "ฮัลโหล", 0);
    b.append("scammer", "ครับ", 1);
    b.endScammerTurn();
    b.append("player", "ใช่ครับ", 3);
    expect(b.snapshot().map((x) => x.speaker)).toEqual(["player", "scammer", "player"]);
  });

  it("masks sensitive numbers in every snapshot", () => {
    const b = new TranscriptBuilder();
    b.append("player", "เลขบัญชี 123-4-", 5);
    b.append("player", "56789-0 ครับ", 5.4);
    const [turn] = b.snapshot();
    expect(turn.text).toBe("เลขบัญชี [เลขบัญชี] ครับ");
    expect(turn.redactions).toEqual(["bank_account"]);
  });

  it("drops empty and whitespace-only turns", () => {
    const b = new TranscriptBuilder();
    b.append("player", " ", 0);
    b.append("scammer", "", 0);
    expect(b.snapshot()).toEqual([]);
  });
});

describe("TranscriptBuilder interim (ข้อความระหว่างพูด)", () => {
  it("shows the latest interim as a pending player turn, replacing older interim", () => {
    const b = new TranscriptBuilder();
    b.append("scammer", "ใช่เจ้าของเบอร์ไหมครับ", 1);
    b.endScammerTurn();
    b.setInterim("ไม่", 5);
    b.setInterim("ไม่ใช่ครับ", 5.5);
    const live = b.snapshot({ includeInterim: true });
    expect(live.at(-1)).toMatchObject({ speaker: "player", text: "ไม่ใช่ครับ", pending: true, t: 5 });
    expect(b.snapshot()).toHaveLength(1); // ไม่ใส่ interim ในผลที่บันทึก
  });

  it("drops the interim once the final transcription arrives", () => {
    const b = new TranscriptBuilder();
    b.setInterim("ไม่ใช่ครับ", 5);
    b.append("player", "ไม่ใช่ครับ", 6);
    expect(b.snapshot({ includeInterim: true })).toEqual([
      { id: "0", t: 6, speaker: "player", text: "ไม่ใช่ครับ", redactions: [] },
    ]);
  });

  it("keeps the interim when no final ever arrives (the bug Nut saw)", () => {
    const b = new TranscriptBuilder();
    b.append("scammer", "ใช่เจ้าของเบอร์ไหมครับ", 1);
    b.endScammerTurn();
    b.setInterim("ไม่รู้ครับ", 5);
    b.append("scammer", "แล้วพอจะทราบไหมครับ", 7); // AI ตอบไปก่อน ฉบับจริงของผู้เล่นไม่มา
    b.endScammerTurn();
    b.flushInterim();
    expect(b.snapshot().map((x) => [x.speaker, x.text])).toEqual([
      ["scammer", "ใช่เจ้าของเบอร์ไหมครับ"],
      ["player", "ไม่รู้ครับ"], // วางก่อนประโยคที่ AI ตอบ
      ["scammer", "แล้วพอจะทราบไหมครับ"],
    ]);
  });

  it("replaces a flushed interim with the late final text instead of duplicating it", () => {
    const b = new TranscriptBuilder();
    b.setInterim("ไม่รู้คับ", 5);
    b.append("scammer", "ครับ", 7);
    b.endScammerTurn();
    b.flushInterim();
    b.append("player", "ไม่รู้ครับ", 8); // ฉบับจริงมาช้า
    b.append("player", " เลย", 8.2);
    expect(b.snapshot().map((x) => [x.speaker, x.text])).toEqual([
      ["player", "ไม่รู้ครับ เลย"],
      ["scammer", "ครับ"],
    ]);
  });

  it("treats a final that arrives after the next scammer sentence as a new turn", () => {
    const b = new TranscriptBuilder();
    b.setInterim("ฮัลโหล", 5);
    b.append("scammer", "ครับ", 7);
    b.endScammerTurn();
    b.flushInterim();
    b.append("scammer", "ได้ยินไหมครับ", 12);
    b.endScammerTurn();
    b.append("player", "ได้ยินครับ", 14);
    expect(b.snapshot().map((x) => x.text)).toEqual(["ฮัลโหล", "ครับ", "ได้ยินไหมครับ", "ได้ยินครับ"]);
  });

  it("masks interim text too", () => {
    const b = new TranscriptBuilder();
    b.setInterim("บัญชี 123-4-56789-0", 1);
    expect(b.snapshot({ includeInterim: true })[0].text).toBe("บัญชี [เลขบัญชี]");
  });
});

describe("pcm base64", () => {
  it("round-trips PCM16 bytes", () => {
    const pcm = new Int16Array([0, 1, -1, 32767, -32768]);
    const back = new Int16Array(base64ToPcm16Buffer(arrayBufferToBase64(pcm.buffer)));
    expect([...back]).toEqual([...pcm]);
  });

  it("drops a trailing odd byte", () => {
    const b64 = btoa(String.fromCharCode(1, 0, 2));
    expect(base64ToPcm16Buffer(b64).byteLength).toBe(2);
  });
});
