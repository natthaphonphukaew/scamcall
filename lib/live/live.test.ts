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
