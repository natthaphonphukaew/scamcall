import { describe, expect, it } from "vitest";
import { maskSensitive, normalizeThaiDigits } from "./mask";

describe("maskSensitive", () => {
  it.each([
    ["เลขบัตรผม 1-2345-67890-12-3 ครับ", "เลขบัตรผม [เลขบัตรประชาชน] ครับ", "national_id"],
    ["1234567890123", "[เลขบัตรประชาชน]", "national_id"],
    ["บัญชี 123-4-56789-0 ค่ะ", "บัญชี [เลขบัญชี] ค่ะ", "bank_account"],
    ["บัตร 4111 1111 1111 1111", "บัตร [เลขบัตร]", "card_number"],
    ["โทรมาที่ 081-234-5678", "โทรมาที่ [เบอร์โทร]", "phone"],
    ["เบอร์บ้าน 02-123-4567", "เบอร์บ้าน [เบอร์โทร]", "phone"],
    ["รหัส OTP คือ 482913", "รหัส OTP คือ [รหัส OTP]", "otp"],
    ["482913 คือโอทีพีครับ", "[รหัส OTP] คือโอทีพีครับ", "otp"],
  ])("masks %s", (input, expected, type) => {
    const r = maskSensitive(input);
    expect(r.text).toBe(expected);
    expect(r.redactions).toEqual([type]);
  });

  it("detects Thai digits but never keeps the value", () => {
    const r = maskSensitive("เลขบัตร ๑๒๓๔๕๖๗๘๙๐๑๒๓ ครับ");
    expect(r.text).toBe("เลขบัตร [เลขบัตรประชาชน] ครับ");
    expect(r.text).not.toMatch(/[๐-๙0-9]/);
    expect(r.redactions).toEqual(["national_id"]);
  });

  it.each([
    "ยอดเงินประมาณ 50,000 บาท",
    "ผมอายุ 21 ปี",
    "เลขคดีอาญาที่ 1123/2569",
    "ไม่บอกรหัสหรอก จะโทร 1441",
    "แจ้ง 191 ก็ได้",
    "เดี๋ยวโอนให้ 3.5 ล้าน",
  ])("leaves harmless text alone: %s", (input) => {
    expect(maskSensitive(input)).toEqual({ text: input, redactions: [] });
  });

  it("masks several items and reports each type once", () => {
    const r = maskSensitive("บัญชี 1234567890 กับ 0987654321 แล้วก็ 2234567890");
    expect(r.text).toBe("บัญชี [เลขบัญชี] กับ [เบอร์โทร] แล้วก็ [เลขบัญชี]");
    expect(r.redactions).toEqual(["bank_account", "phone"]);
  });

  it("does not treat a short number as OTP without context", () => {
    expect(maskSensitive("ห้อง 482913").redactions).toEqual([]);
  });
});

describe("normalizeThaiDigits", () => {
  it("keeps length so indices line up", () => {
    const s = "โทร ๐๘๑";
    expect(normalizeThaiDigits(s)).toBe("โทร 081");
    expect(normalizeThaiDigits(s).length).toBe(s.length);
  });
});
