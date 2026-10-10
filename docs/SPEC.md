# ScamCall — Technical Spec

> เวอร์ชัน 0.1 · 2026-10-09 · คู่กับ `CLAUDE.md` (บรีฟ) — ถ้าขัดกัน ให้ถือ CLAUDE.md ข้อ 7 (ความปลอดภัย) เหนือทุกอย่าง แล้วอัปเดตเอกสารให้ตรงกัน
> รายละเอียดลงมือทำ: Week 1 ละเอียด, Week 2–4 เป็นภาพรวม (จะขยายเมื่อถึงสัปดาห์นั้น)

---

## 1. เป้าหมาย / สิ่งที่ไม่ทำ

**เป้าหมาย**
- ผู้เล่นได้ "รับสาย" มิจฉาชีพ AI ด้วยเสียงภาษาไทยแบบเรียลไทม์ บนมือถือ ภายใน 3 คลิกจากหน้าแรก
- หลังวางสาย ได้เห็น Scam X-Ray ว่าโดนเทคนิคอะไร ตรงไหนควรวาง และได้คะแนน
- เดโมหน้าห้องได้ลื่นไหล: latency ตอบกลับ < ~1.5 วินาที (วัดจริงใน Week 1)

**ไม่ทำ (non-goals)**
- ไม่มีการโทรออก/รับสายจริง, ไม่มี SIP/VoIP/SMS — ทุกอย่างอยู่ในเบราว์เซอร์
- ไม่เก็บไฟล์เสียงผู้ใช้ทั้งฝั่ง client และ server
- ไม่มีระบบบัญชีผู้ใช้/ล็อกอิน (leaderboard ใน Week 4 ใช้ชื่อเล่นแบบไม่ยืนยันตัวตน)
- ไม่รองรับหลายภาษา — ไทยอย่างเดียว

---

## 2. หน้าและ state ของสาย

### 2.1 Routes
| Route | หน้าที่ | สัปดาห์ |
|---|---|---|
| `/` | หน้าแรก + disclaimer "นี่คือการจำลองเพื่อการฝึก" + ปุ่มเริ่ม | 2 |
| `/levels` | เลือกด่าน (การ์ด: ชื่อ, ความยาก, caller ID) | 2 |
| `/call/[levelId]` | สายเรียกเข้า → ระหว่างโทร | 1 (แบบเรียบ), 2 (สวย) |
| `/xray/[sessionId]` | Scam X-Ray + คะแนน | 3 |
| `POST /api/token` | ออก ephemeral token | 1 |
| `POST /api/analyze` | transcript → AnalysisResult | 3 |

### 2.2 State machine ของสาย (`/call/[levelId]`)
```
idle ──(เปิดหน้า)──▶ ringing ──(รับสาย)──▶ connecting ──(ws open + เสียงแรก)──▶ in_call
  │                     │                       │                                  │
  │                (ตัดสาย)                 (error)                      (วางสาย/หมดเวลา/error)
  │                     ▼                       ▼                                  ▼
  └──────────────────▶ ended ◀──────────────────┴──────────────────────────────────┘
                          │
                    (มี turn ≥ 1)
                          ▼
                     analyzing ──▶ xray
```
- `endedBy`: `'player' | 'timeout' | 'error' | 'declined'` (`declined` = ตัดสายตั้งแต่ตอนเรียกเข้า → ชนะทันที คะแนนเต็ม)
- **ปุ่มวางสายต้องกดได้ในทุก state** ตั้งแต่ `ringing` ถึง `in_call`
- Week 1 ยังไม่มี `ringing` / `analyzing` / `xray` → เริ่มที่ปุ่ม "รับสาย" แล้วจบที่ `ended` พร้อมโชว์ transcript

---

## 3. API contracts

### 3.1 `POST /api/token`
**Request** `{ "levelId": "police-money-laundering" }`

**Response 200**
```json
{ "token": "auth_tokens/…", "model": "gemini-3.8-live", "maxCallSeconds": 180, "expiresAt": "2026-10-09T13:05:00Z" }
```
- `model` ส่งกลับเพราะ `ai.live.connect()` ฝั่ง browser ต้องระบุ (ไม่ใช่ความลับ และ token ล็อก model ไว้แล้ว)
- ทั้ง server และ browser ใช้ `httpOptions: { apiVersion: "v1alpha" }` (`LIVE_API_VERSION` ใน `lib/live/constants.ts`) — SDK 2.28 รองรับ ephemeral token เฉพาะ v1alpha ทดสอบเชื่อมต่อจริงแล้ว 2026-10-09

**ทำงานยังไง (server)**
1. ตรวจ `levelId` → `loadScenario(levelId)`; ไม่มี → `404 { error: "level_not_found" }`
2. `buildSystemPrompt(scenario)` (ข้อ 7)
3. `ai.authTokens.create({ config })` โดย
   - `uses: 1`
   - `newSessionExpireTime` = now + 60s (ต้องเริ่ม session ภายใน 1 นาที)
   - `expireTime` = now + (maxCallSeconds + 60)s → hard stop ฝั่ง server ถ้า client โกงตัวจับเวลา
   - `liveConnectConstraints`:
     - `model: process.env.GEMINI_LIVE_MODEL`
     - `config: { responseModalities: [AUDIO], systemInstruction, inputAudioTranscription: {}, outputAudioTranscription: {}, speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } }`
   - ⇒ **system prompt อยู่ใน token ฝั่ง server** browser ไม่เห็นและแก้ไม่ได้
4. `maxCallSeconds = min(scenario.maxSeconds ?? ∞, env MAX_CALL_SECONDS)`

**Errors**
| กรณี | Response |
|---|---|
| body ผิดรูปแบบ | `400 { error: "bad_request" }` |
| ไม่พบด่าน | `404 { error: "level_not_found" }` |
| ยิงถี่เกิน (in-memory: 5 ครั้ง/นาที/IP) | `429 { error: "rate_limited" }` |
| ไม่มี `GEMINI_API_KEY` / Gemini error | `500 { error: "token_failed" }` — log รายละเอียดฝั่ง server เท่านั้น |

> หมายเหตุ: rate limit แบบ in-memory ใช้ได้ดีตอน dev/เดโม บน Vercel แต่ละ instance นับแยกกัน — ยอมรับได้สำหรับโปรเจกต์นี้

### 3.2 `POST /api/analyze` (Week 3)
**Request** = `CallSession` (ข้อ 4) — transcript ที่ mask แล้วเท่านั้น
**Response 200** = `AnalysisResult` (ข้อ 4) บังคับด้วย `responseSchema` ของ Gemini (`GEMINI_ANALYSIS_MODEL`)
- server ตรวจซ้ำ: `tactics` ต้องอยู่ใน taxonomy 8 ตัว, `pressure` clamp 0–10, `t` ต้องตรงกับ turn ที่มีจริง
- ถ้าวิเคราะห์ไม่สำเร็จ → `502 { error: "analyze_failed" }` แล้ว UI ให้กด "ลองใหม่"

---

## 4. Data types (`lib/types.ts`)

```ts
export type TacticId =
  | 'authority' | 'fear' | 'urgency' | 'isolation'
  | 'legitimacy' | 'info_request' | 'money_request' | 'rapport';

export type RedactionType = 'national_id' | 'bank_account' | 'card_number' | 'otp' | 'phone';

export interface Scenario {
  id: string;                 // ตรงกับชื่อไฟล์ scenarios/<id>.json
  title: string;
  difficulty: 1 | 2 | 3;
  archetype: string;          // จาก dataset AOC 1441 — ตอนนี้ "TODO-AOC"
  callerId: string;
  persona: string;
  openingLine: string;
  escalationSteps: string[];
  targetInfo: string[];
  fakeVictimProfile: Record<string, string>;
  correctExit: string;
  voice?: string;             // prebuilt voice name, default "Orus"
  maxSeconds?: number;
}

export interface TranscriptTurn {
  id: string;
  t: number;                  // วินาทีนับจากเริ่มสาย (เวลาที่ turn เริ่ม)
  speaker: 'scammer' | 'player';
  text: string;               // mask แล้ว
  redactions: RedactionType[];
}

export interface CallSession {
  sessionId: string;          // crypto.randomUUID()
  levelId: string;
  startedAt: string;          // ISO
  endedAt: string;
  endedBy: 'player' | 'timeout' | 'error' | 'declined';
  hangupT: number;            // วินาทีที่วางสาย (0 ถ้า declined)
  turns: TranscriptTurn[];
}

export interface AnalyzedTurn {
  t: number;
  speaker: 'scammer' | 'player';
  text: string;
  tactics: TacticId[];        // ว่างได้ (โดยเฉพาะฝั่ง player)
  pressure: number;           // 0–10
}

export interface AnalysisResult {
  turns: AnalyzedTurn[];
  shouldHangUpAt: number;     // วินาที
  leakedInfo: string[];       // ชื่อหมวด เช่น "ชื่อ-นามสกุล" ไม่ใช่ค่าจริง
  complied: boolean;          // ⭐ เพิ่มจาก CLAUDE.md: ผู้เล่นตกลงจะโอน/ทำตามคำขอเงิน
  saidCallback: boolean;      // ⭐ เพิ่มจาก CLAUDE.md: บอกว่าจะวางแล้วโทรกลับเบอร์ทางการ/1441
  summary: string;
  tips: string[];
}

export interface ScoreResult {
  score: number;              // 0–100
  grade: 'strong' | 'close' | 'scammed';
  breakdown: { label: string; delta: number }[];
}
```

**การเก็บข้อมูล — Week 1–3 ไม่มี database**
| ข้อมูล | เก็บที่ | เหตุผล |
|---|---|---|
| ด่าน (`Scenario`) | ไฟล์ `scenarios/*.json` ใน repo | เป็นเนื้อหาที่เราเขียนเอง แก้ผ่าน git, review ง่าย, ไม่ต้องมี admin UI |
| ผลสาย (`CallSession`, `AnalysisResult`) | `sessionStorage` key `scamcall:session:<sessionId>` | หายเมื่อปิดแท็บ = ตรงกับกติกา "ไม่เก็บ transcript ถ้าไม่ยินยอม" และไม่มีข้อมูลส่วนตัวค้างบน server |
| API key / พรอมต์ | env + server เท่านั้น | — |

**Week 4 (optional) — Supabase (Postgres)** เพิ่มเมื่อมีฟีเจอร์ที่ต้องข้ามเครื่องจริงๆ:
- `leaderboard` — `{ id, nickname, levelId, score, hangupT, createdAt }` ส่งเฉพาะเมื่อผู้เล่นกดยินยอม **ไม่ส่ง transcript**
- `playtest_runs` — สำหรับเก็บหลักฐาน "รอบ 1 vs รอบ 2" ตอนทดสอบกับเพื่อน `{ testerCode, round, levelId, hangupT, score }` ใช้รหัสผู้ทดสอบแทนชื่อจริง
- เขียนผ่าน API route ฝั่ง server (service key อยู่ใน env) ไม่ให้ browser เขียนตรง

> ถ้าวิชาบังคับให้มี database ตั้งแต่ต้น ย้าย `playtest_runs` ขึ้นมาทำ Week 2 ได้โดยไม่กระทบส่วนอื่น เพราะทุกอย่างผ่าน type `CallSession` เดียวกัน

---

## 5. การให้คะแนน (`lib/scoring.ts`)

`computeScore(session: CallSession, analysis: AnalysisResult): ScoreResult` — pure function, มี unit test

| กฎ | ค่า |
|---|---|
| `endedBy === 'declined'` | 100 จบ (ไม่คิดกฎอื่น) |
| `analysis.complied` | 0, grade `scammed` จบ |
| ฐานเวลา: `hangupT ≤ shouldHangUpAt` | 100 |
| ฐานเวลา: ช้ากว่า | `100 − ceil((hangupT − shouldHangUpAt) / 2)` ต่ำสุด 40 |
| `endedBy === 'timeout'` (ไม่วางเองเลย) | ฐานเวลา = 40 |
| ข้อมูลหลุด | −10 ต่อรายการใน `leakedInfo` (รวม redactions ที่ไม่ซ้ำหมวด) |
| `saidCallback` | +10 |
| สุดท้าย | clamp 0–100 |

เกรด: ≥ 90 `strong` "ภูมิคุ้มกันแกร่ง" · 60–89 `close` "รอดแบบเฉียดฉิว" · < 60 `scammed` "โดนหลอกแล้ว"

> ตัวเลขเป็นร่างแรก — ปรับหลังทดสอบกับเพื่อนใน Week 4 (ทุกครั้งที่ปรับต้องแก้ test ด้วย)

---

## 6. Privacy & masking (`lib/privacy/mask.ts`)

`maskSensitive(text: string): { text: string; redactions: RedactionType[] }` — pure function

1. **Normalize**: แปลงเลขไทย `๐–๙` → `0–9` (ใช้ตรวจเท่านั้น ข้อความที่แสดงใช้เวอร์ชันที่ mask แล้ว)
2. **รวมกลุ่มตัวเลข**: ตัวเลขที่คั่นด้วยเว้นวรรค/ขีด/จุด ถือเป็นก้อนเดียว (เช่น `1-2345-67890-12-3`)
3. **จัดประเภทตามจำนวนหลัก**
   | หลัก | ประเภท | แสดงเป็น |
   |---|---|---|
   | 13 | `national_id` | `[เลขบัตรประชาชน]` |
   | 14 ขึ้นไป | `card_number` | `[เลขบัตร]` |
   | 10 ขึ้นต้น 06/08/09 หรือ 9 ขึ้นต้น 0 | `phone` | `[เบอร์โทร]` |
   | 10–12 (อื่นๆ) | `bank_account` | `[เลขบัญชี]` |
   | 4–6 และอยู่ใกล้คำว่า OTP/โอทีพี/รหัส/พิน/pin ภายใน ~20 ตัวอักษร | `otp` | `[รหัส OTP]` |

   ยกเว้นสายด่วนทางการ (1441, 1599, 1213, 1111, 1202) ไม่ mask เพราะเป็นคำตอบที่ถูก
4. ใช้กับ **ทั้งสองฝั่ง** (ทั้ง player และ scammer) ก่อนเก็บลง turn ทุกครั้ง
5. ค่าจริงไม่ถูกเก็บที่ไหนเลย — เก็บแค่ `redactions`
6. **ความยินยอม** (`lib/consent.ts`, เก็บใน localStorage `scamcall:consent:v1` ของเครื่องผู้เล่นเท่านั้น)
   - `acknowledged` (บังคับ) — ติ๊กว่าเข้าใจว่าเป็นการจำลอง ก่อนรับสายได้ ทั้งจากหน้าแรกและเมื่อเปิดลิงก์ `/call/*` ตรงๆ
   - `saveTranscript` (ไม่บังคับ, ค่าเริ่มต้นติ๊กไว้) — เก็บ transcript ที่ mask แล้วลง sessionStorage + ส่งให้ AI วิเคราะห์ X-Ray; ถ้าไม่ยินยอม `LiveCallController` จะไม่บันทึก และหน้าจบสายบอกว่า "ไม่ได้บันทึก"
7. **ข้อจำกัดที่รู้อยู่แล้ว**: ถ้า STT ถอดเลขเป็นคำ ("ศูนย์แปดหนึ่ง…") regex จะจับไม่ได้ → Week 1 จะเช็กว่า transcription ส่งเลขมาในรูปแบบไหน ถ้าเป็นคำ ค่อยเพิ่มตัวแปลงคำอ่านเลขไทย → ตัวเลข

---

## 7. การออกแบบพรอมต์ (`lib/scenarios/buildSystemPrompt.ts`)

`buildSystemPrompt(scenario: Scenario): string` — ที่เดียวที่สร้างพรอมต์ ห้ามเขียนพรอมต์ใน component/route

**โครงพรอมต์ (เรียงตามลำดับนี้)**
1. **กรอบการจำลอง (ล็อกตายตัว)** — นี่คือการจำลองเพื่อฝึกนักศึกษาให้รู้ทันมิจฉาชีพ, ผู้ใช้รู้และยินยอม, AI เล่นบทคนร้ายเพื่อการศึกษา
2. **กฎความปลอดภัย (ล็อกตายตัว)**
   - ห้ามขอเลขบัญชี/เลขบัตร/OTP/รหัสผ่าน/เลขบัตรประชาชน **ที่เป็นของจริง** — ขอได้แค่ "ชื่อธนาคาร", "ยอดเงินโดยประมาณ", ชื่อ
   - ห้ามพูดเลขบัญชีปลายทางใดๆ (เลขสมมติก็อาจบังเอิญตรงกับบัญชีจริง) → ให้บอกว่า "เลขบัญชีจะส่งให้ทางไลน์หลังวางสาย" ซึ่งตรงกับเคสจริงด้วย
   - ถ้าผู้ใช้พูดตัวเลขที่ดูเหมือนข้อมูลจริง ห้ามพูดทวน
   - ห้ามพูดชื่อเว็บไซต์/ลิงก์/ชื่อแอป/เบอร์โทร → "จะส่งลิงก์ให้ทางไลน์หลังวางสาย" (ด่านสรรพากรหลอกให้ติดตั้งแอป)
   - ห้ามพูดชื่อธนาคาร/บริษัท/แบรนด์จริงขึ้นมาเอง ทวนได้เฉพาะที่ผู้ใช้พูดก่อน
   - unit test ตรวจทุกด่าน: ข้อความในบทต้องไม่มีตัวเลขที่ mask จับได้ และไม่มี URL
   - ห้ามหยาบคาย ห้ามคุกคามทางเพศ ห้ามขู่รุนแรงเกินกว่าเคสจริง (ขู่เรื่องคดี/หมายจับ/อายัดบัญชีได้ แต่ห้ามขู่ทำร้ายร่างกาย)
   - ห้ามสอนวิธีหลอกใหม่ที่ไม่มีในเคสสาธารณะ
   - ห้ามออกจากบท ยกเว้น (ก) ผู้ใช้พูด safe word **"หยุดการจำลอง"** หรือ (ข) แสดงอาการทุกข์ใจจริง (ร้องไห้, บอกว่าเครียดจริง) → หลุดบทแล้วบอกว่า "นี่คือการจำลอง คุณปลอดภัย" และไม่กลับเข้าบท
3. **วิธีพูด** — ภาษาไทยเท่านั้น, ประโยคสั้นแบบโทรศัพท์ 1–2 ประโยคต่อครั้ง, ใช้ภาษาราชการแบบเจ้าหน้าที่, ไม่พูดเป็น bullet
4. **บท** — `persona`, `callerId`, เมื่อได้รับข้อความ "(ผู้ใช้รับสายแล้ว)" ให้พูด `openingLine`
5. **การยกระดับ** — `escalationSteps` เรียงลำดับ; ถ้าเหยื่อสงสัย/ถามกลับ → ข้ามไปขั้นที่กดดันกว่าหนึ่งขั้น และใช้ `legitimacy` (เลขคดี, ชื่อเจ้าหน้าที่, โอนสาย)
6. **เป้าหมายข้อมูล** — `targetInfo`
7. **ข้อมูลสมมติ** — `fakeVictimProfile` (ถ้าผู้เล่นถามว่า "รู้ได้ไงว่าเป็นผม" ให้อ้างข้อมูลสมมตินี้)
8. **ตอนจบ** — ถ้าผู้เล่นบอกว่าจะวางแล้วโทรกลับ 1441/สถานีตำรวจ → พยายามห้ามหนึ่งครั้ง ("ถ้าวางสายจะถือว่าขัดขวางการสอบสวน") แล้วถ้ายืนยันก็ยอมจบ

---

## 8. Error handling

| สถานการณ์ | พฤติกรรม |
|---|---|
| ไมค์ถูกปฏิเสธ | อยู่ใน `idle`, บอกวิธีอนุญาตไมค์ (iOS Safari / Chrome Android), ไม่ขอ token |
| `/api/token` 429 | "ระบบไม่ว่าง ลองใหม่ใน 1 นาที" |
| `/api/token` 500 / Gemini quota | "ตอนนี้โควตา AI เต็ม" + ปุ่มลองใหม่ |
| WebSocket ปิดกลางสาย (`onclose`) | `ended` + `endedBy: 'error'` → ไป X-Ray ด้วย turn ที่มี (ถ้ามี ≥ 1 turn) |
| หมดเวลา `maxCallSeconds` | client วางสายเอง `endedBy: 'timeout'` |
| ผู้ใช้สลับแอป/ปิดจอ (`visibilitychange` → hidden นานกว่า 10 วินาที) | วางสาย `endedBy: 'error'` กันสายค้างกินโควตา |

ทุกกรณีต้อง cleanup: หยุด `MediaStream` tracks, ปิด `AudioContext`, `session.close()`, ล้าง timer

---

## 9. สถาปัตยกรรมเสียง (Week 1)

```
[ไมค์] getUserMedia (echoCancellation, noiseSuppression)
   └▶ AudioContext (rate ตามเครื่อง เช่น 48k)
        └▶ AudioWorklet pcm-recorder.js  ── downsample → Int16 16kHz, ส่ง chunk ~40ms
              └▶ base64 → session.sendRealtimeInput({ audio: { data, mimeType: 'audio/pcm;rate=16000' } })

session.onmessage
   ├─ serverContent.modelTurn.parts[].inlineData (PCM16 24k base64)
   │     └▶ AudioContext({ sampleRate: 24000 }) → AudioWorklet pcm-player.js (ring buffer)
   ├─ serverContent.interrupted        → player.port.postMessage('clear')
   ├─ serverContent.inputTranscription  → turn ของ player (ต่อท้ายจนกว่า speaker เปลี่ยน)
   ├─ serverContent.outputTranscription → turn ของ scammer
   └─ serverContent.turnComplete        → ปิด turn ปัจจุบัน
```
- **ทำไมใช้สอง AudioContext**: ฝั่งเล่นตั้ง 24k ตรงกับขาออก ไม่ต้อง resample, ฝั่งอัดใช้ rate ของเครื่องแล้ว downsample เอง (Safari ไม่ยอมให้ตั้ง rate ไมค์)
- **Opening line**: หลัง connect ส่ง `sendClientContent({ turns: [{ role: 'user', parts: [{ text: '(ผู้ใช้รับสายแล้ว)' }] }], turnComplete: true })` → AI พูดก่อน
- **การรวม transcript เป็น turn**: chunk ที่ speaker เดียวกันติดกันรวมเป็น turn เดียว, `t` = เวลาที่ chunk แรกมาถึง − เวลาเริ่มสาย, mask ตอนปิด turn (และ mask ตัวที่แสดงสดด้วย)
- **วัด latency**: เวลาตั้งแต่ `inputTranscription` chunk สุดท้าย → audio chunk แรกของ turn ถัดไป แล้ว log `console.info('[latency]', ms)`

---

## 10. Scenario ด่านแรก

`scenarios/police-money-laundering.json` — สร้างจากรูปแบบเคสตำรวจปลอม/ฟอกเงินที่เป็นข่าวสาธารณะ, `archetype: "TODO-AOC"` รอ Nut ใส่หลังได้ dataset

**ด่านทั้งหมด (Week 2)** — ทุกด่าน `archetype: "TODO-AOC"` รอ map กับ dataset

| id | ความยาก | ผู้โทร | เทคนิคเด่น | เสียง |
|---|---|---|---|---|
| `bank-account-hacked` | 1 | ฝ่ายป้องกันทุจริต ธนาคาร | urgency, rapport, money_request (บัญชีพักเงิน) | Kore |
| `police-money-laundering` | 2 | สภ.เมืองนนทบุรี | authority, fear, isolation, legitimacy | Orus |
| `parcel-illegal-goods` | 2 | ศูนย์บริการขนส่งพัสดุ → ตำรวจ | legitimacy (โอนสาย), fear, isolation | Kore |
| `revenue-tax-refund` | 3 | กรมสรรพากร | rapport ("พี่ช่วยน้อง"), urgency, ติดตั้งแอปจากลิงก์ | Charon |

ยากสุดคือสรรพากร เพราะเริ่มด้วยข่าวดี + ความเป็นมิตร ไม่มีการขู่ให้ระวังตัวในช่วงแรก
ตัวเลือกเพิ่มในอนาคต: ไฟฟ้า/ประปาค้างชำระ, เจ้าหน้าที่มหาวิทยาลัย/ทุนการศึกษา

**Ringtone** — `lib/live/ringtone.ts` สังเคราะห์ด้วย Web Audio (400+450 Hz แบบ "กริ๊ง-กริ๊ง" ทุก 3 วินาที) + `navigator.vibrate` (Android) หยุดเองหลัง 30 วินาที; ถ้าเปิดลิงก์ตรงโดยยังไม่เคยแตะหน้า browser จะไม่ให้เล่นเสียง (เงียบ ไม่ใช่ error)

---

## 11. Environment variables

| ชื่อ | ค่าเริ่มต้น (`.env.example`) | หมายเหตุ |
|---|---|---|
| `GEMINI_API_KEY` | — | `.env.local` เท่านั้น ห้าม commit |
| `GEMINI_LIVE_MODEL` | `gemini-3.8-live` | เช็กกับ ai.google.dev/gemini-api/docs/models ณ 2026-10-09 |
| `GEMINI_ANALYSIS_MODEL` | `gemini-3.5-flash-lite` | ถ้าแท็กไม่แม่นค่อยขยับไป `gemini-3.8-flash` |
| `GEMINI_LIVE_VOICE` | `Orus` | default ถ้า scenario ไม่ระบุ — ฟังจริงแล้วค่อยเลือก |
| `MAX_CALL_SECONDS` | `180` | ช่วง dev ตั้ง 60 ประหยัดโควตา |

---

## 12. Testing

| ชั้น | เครื่องมือ | ครอบคลุม |
|---|---|---|
| Unit | Vitest | `maskSensitive`, `buildSystemPrompt` (มีกฎความปลอดภัยครบ, ใส่ข้อมูลด่านครบ), `loadScenario` (validate schema), `computeScore` (Week 3) |
| API | curl / Vitest + mock `@google/genai` | `/api/token` 200/400/404/429, response ไม่มี API key/system prompt |
| Manual | Nut + มือถือจริง | คุณภาพเสียง, latency, การเล่นบท, interruption, auto hang-up |

---

## 13. Roadmap รายสัปดาห์ (ภาพรวม)

### Week 1 — โทรคุยกับ AI คนร้ายได้ (ละเอียดดูแผน 2.1–2.7)
ไฟล์: `lib/types.ts`, `lib/scenarios/*`, `lib/privacy/mask.ts`, `lib/live/*`, `public/worklets/*`, `app/api/token/route.ts`, `app/call/[levelId]/page.tsx`, `scenarios/police-money-laundering.json`
ผลลัพธ์: `docs/week1-findings.md` + ตัดสินใจ Live API vs แผนสำรอง

### Week 2 — เหมือนโดนโทรจริง
`components/IncomingCallScreen.tsx`, `components/InCallScreen.tsx`, `public/sounds/ringtone.mp3`, `app/page.tsx` (disclaimer), `app/levels/page.tsx`, ด่าน 3–5 ไฟล์ใน `scenarios/`, การสั่น (`navigator.vibrate`) ตอนเรียกเข้า

### Week 3 — Scam X-Ray + คะแนน
`app/api/analyze/route.ts` (+ `lib/analysis/schema.ts`), `lib/scoring.ts` + test, `components/XRayTimeline.tsx`, `components/PressureChart.tsx` (Recharts + เส้น "ควรวางสายตรงนี้"), `components/ScoreCard.tsx`, `app/xray/[sessionId]/page.tsx`

### Week 4 — ขัดเงา + หลักฐาน
`app/manifest.ts` + service worker + icons, ทดสอบ iOS Safari/Chrome Android, ทดสอบกับเพื่อน 5–10 คน (เวลาวางสายรอบ 1 vs 2), (optional) Supabase leaderboard, deploy Vercel, ซ้อมเดโม

---

## 14. แผนสำรอง (ถ้า Live API ไม่ผ่านเกณฑ์ใน Week 1)

เกณฑ์ "ไม่ผ่าน": โมเดลไม่ยอมเล่นบทแม้ปรับพรอมต์ 2–3 รอบ, เสียงไทยแปร่งจนไม่น่าเชื่อ, หรือ latency > 3 วินาทีเป็นประจำ

Pipeline สำรอง: `gemini-3.5-transcribe-live` (STT) → `gemini-3.8-flash` (บทสนทนา, ใช้ `buildSystemPrompt` เดิม) → `gemini-3.8-flash-tts` (TTS)
ข้อเสีย: latency สูงขึ้น, ขัดจังหวะยากขึ้น — แต่ data model, masking, X-Ray, scoring ใช้ต่อได้ทั้งหมด

---

## 15. สถาปัตยกรรม UI — ให้เปลี่ยนหน้าตาได้ง่าย

Week 1 ยังไม่ออกแบบหน้าตา แต่จัดโครงให้ **เปลี่ยน UI ได้ทั้งหมดโดยไม่แตะ logic**

**กฎแยกชั้น (headless)**
```
lib/live/useLiveCall.ts   ← logic ทั้งหมด: state, เวลา, transcript, เสียง  (ห้าม import React component)
        │  คืนค่า { status, elapsed, remaining, turns, isScammerSpeaking, error, answer(), hangUp() }
        ▼
app/call/[levelId]/CallController.tsx   ← ตัวเชื่อม: เรียก hook แล้วเลือกว่าจะแสดง screen ไหนตาม status
        │  ส่ง props ลงไปเท่านั้น
        ▼
components/call/*Screen.tsx   ← หน้าตาล้วนๆ: รับ props, ไม่มี fetch/useEffect เรื่องเสียง
```
- อยากเปลี่ยนดีไซน์ = แก้/เขียน `components/call/*` ใหม่ทั้งชุด ตราบใดที่ props เหมือนเดิม logic ไม่พัง
- props ของแต่ละ screen ประกาศเป็น type ใน `components/call/types.ts` — เป็น "สัญญา" ระหว่าง logic กับดีไซน์

**Design tokens**
- สี/ฟอนต์/ระยะ/มุมโค้ง ประกาศเป็น CSS variables ที่เดียวใน `app/globals.css` (Tailwind v4 `@theme`) เช่น `--color-danger` (ปุ่มวางสาย), `--color-accept`, `--color-surface`
- component ใช้ class ที่อ้าง token (`bg-danger`, `bg-surface`) ห้ามใส่สี hex ตรงๆ → เปลี่ยนธีมทั้งแอปได้จากไฟล์เดียว
- ฟอนต์ไทย: `next/font` (เช่น IBM Plex Sans Thai / Noto Sans Thai) ประกาศใน layout ที่เดียว

**UI primitives** (`components/ui/`) — `Button`, `Screen` (โครงเต็มจอมือถือ + safe-area), `TranscriptList` ทำแบบเรียบที่สุด Week 2 ค่อยแต่ง

**ข้อความ UI** — ข้อความภาษาไทยที่ใช้ซ้ำ (ป้ายปุ่ม, ป้าย tactic ข้อ 9 ของ CLAUDE.md) อยู่ใน `lib/copy.ts` ไม่กระจายใน component

**Week 1 มีแค่**: `RingingScreen` (ปุ่มรับ/ตัดสาย), `InCallScreen` (เวลา + transcript สด + ปุ่มวาง ใช้ทั้งตอน connecting และ in_call), `EndedScreen` (transcript สุดท้าย) — โครงไม่สวย แต่ props ครบตามสัญญาใน `components/call/types.ts`

**โครงไฟล์จริง**: logic อยู่ใน `lib/live/LiveCallController.ts` (class ไม่ผูก React) → `lib/live/useLiveCall.ts` (useSyncExternalStore) → `app/call/[levelId]/CallController.tsx` → `components/call/*Screen.tsx`

---

## 16. คำถามที่ยังเปิดอยู่
- [ ] รายชื่อ 8 archetype และ mapping ด่าน ↔ archetype (Nut — รอ `aoc1441-cases-tagged.csv`)
- [ ] เสียง prebuilt ตัวไหนฟังเป็นตำรวจไทยน่าเชื่อที่สุด (ทดสอบ Week 1)
- [ ] transcription ส่งตัวเลขมาเป็นตัวเลขหรือคำอ่าน (ทดสอบ Week 1 → กระทบข้อ 6)
- [ ] ตัวเลขคะแนนข้อ 5 (ปรับ Week 4)
- [ ] วิชาบังคับให้มี database ไหม (Nut ถามอาจารย์) → ถ้าใช่ ย้าย Supabase ขึ้นมา Week 2 (ข้อ 4)
