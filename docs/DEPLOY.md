# Deploy & เดโม — checklist

> ทุกขั้นที่ต้อง login / สร้างบัญชี Nut ทำเอง · ค่า secret ทั้งหมดใส่ใน `.env.local` (เครื่อง) และ Vercel (production) เท่านั้น ห้าม commit

## 1. Supabase (leaderboard + ผลทดสอบกับเพื่อน)

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com) — region **Southeast Asia (Singapore)** จะเร็วที่สุด
2. **SQL Editor** → วางทั้งไฟล์ `supabase/migrations/001_scamcall.sql` → **Run**
   - ได้ตาราง `leaderboard` และ `playtest_runs` เปิด RLS แล้ว ไม่มี policy (browser เข้าถึงตรงไม่ได้)
3. **Project Settings → Data API** → คัดลอก Project URL → `SUPABASE_URL`
4. **Project Settings → API Keys → Secret keys** → สร้าง/คัดลอก `sb_secret_...` → `SUPABASE_SECRET_KEY`
   - ใช้ **secret key** (ไม่ใช่ publishable) เพราะแอปเขียนผ่าน API route ฝั่ง server เท่านั้น
5. สุ่ม `RESULT_SIGNING_SECRET` (คนละค่ากับเครื่อง dev ก็ได้):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```
6. ใส่ทั้ง 3 ค่าใน `.env.local` → รีสตาร์ท `npm run dev` → เล่นจบ 1 สาย → ดู X-Ray → ส่งชื่อเล่น → เปิด `/leaderboard` ต้องเห็นชื่อ

**ลบชื่อที่ไม่เหมาะสม:** Supabase → Table Editor → `leaderboard` → เลือกแถว → Delete

## 2. GitHub

1. สร้าง repo ใหม่บน GitHub (แนะนำ **Private**)
2. push โค้ด (ใน `C:\dev\scamcall`):
   ```bash
   git remote add origin https://github.com/<user>/scamcall.git
   ```
   ```bash
   git push -u origin main
   ```
   - `.env.local` ถูก ignore แล้ว — เช็กอีกรอบด้วย `git status` ว่าไม่มีไฟล์ env ติดไป

## 3. Vercel

1. [vercel.com](https://vercel.com) → Add New → Project → Import repo `scamcall` (Framework: Next.js ตรวจเจอเอง)
2. **Environment Variables** (Production + Preview):

   | ชื่อ | ค่า |
   |---|---|
   | `GEMINI_API_KEY` | key จาก AI Studio |
   | `GEMINI_LIVE_MODEL` | `gemini-3.8-live` |
   | `GEMINI_ANALYSIS_MODEL` | `gemini-3.5-flash-lite` |
   | `GEMINI_LIVE_VOICE` | `Orus` |
   | `MAX_CALL_SECONDS` | `180` |
   | `RESULT_SIGNING_SECRET` | ค่าที่สุ่มในข้อ 1.5 |
   | `SUPABASE_URL` | จากข้อ 1.3 |
   | `SUPABASE_SECRET_KEY` | จากข้อ 1.4 |
3. Deploy → ได้ URL `https://<project>.vercel.app` (HTTPS = ใช้ไมค์บนมือถือได้)
4. ต่อจากนี้ `git push` ทีไร Vercel deploy ให้เอง

## 4. ทดสอบบนมือถือจริง

- [ ] เปิด URL บน Android Chrome → รับสาย → อนุญาตไมค์ → คุยได้
- [ ] เปิดบน iPhone Safari → เหมือนกัน (iOS ต้องกดปุ่มรับสายก่อนถึงจะมีเสียง — ออกแบบไว้แล้ว)
- [ ] ติดตั้งเป็นแอป: Android → เมนู ⋮ → "ติดตั้งแอป" · iPhone → ปุ่มแชร์ → "เพิ่มไปยังหน้าจอโฮม"
- [ ] เปิดจากไอคอนบนหน้าจอโฮม → เต็มจอ ไม่มีแถบ browser
- [ ] ringtone ดัง (ต้องแตะหน้าจอสักครั้งก่อน) + Android สั่น
- [ ] X-Ray → ส่งชื่อเล่น → ขึ้น `/leaderboard`
- [ ] ปิดเน็ตแล้วเปิดแอป → เห็นหน้า "ตอนนี้ออฟไลน์อยู่"

## 5. ทดสอบกับเพื่อน 5–10 คน (หลักฐานในรายงาน)

1. เปิด `https://<project>.vercel.app/playtest` บนเครื่องที่จะให้เพื่อนเล่น
2. ใส่รหัส `P01` รอบ `1` → เริ่มโหมดทดสอบ → ส่งเครื่องให้เพื่อน → เล่น 1 ด่าน → ดู X-Ray (ผลส่งให้เอง)
3. อธิบายบทเรียนจาก X-Ray ให้เพื่อนฟัง → กด "ไปรอบ 2" → ให้เล่น **ด่านอื่น** อีก 1 ด่าน
4. คนถัดไป: "ปิดโหมดทดสอบ" → ใส่ `P02` รอบ 1 → ทำซ้ำ
5. จบแล้วเปิด `/playtest` → ดูตารางรอบ 1 vs 2 → **ดาวน์โหลด CSV** ไปทำกราฟ
   - ตัวชี้วัดหลักคือ "วางช้าเฉลี่ย" (วินาทีหลังจุดที่ควรวาง) เพราะแต่ละด่านมีจุดอันตรายไม่เท่ากัน
   - อย่าให้เล่นด่านเดิมซ้ำในรอบ 2 — จะวัดการจำบท ไม่ใช่การรู้ทันเทคนิค

## 6. ซ้อมเดโมหน้าห้อง

- [ ] ใช้มือถือเครื่องเดียว + Wi-Fi ที่เสถียร (หรือ hotspot สำรอง) — เปิดแอปค้างไว้ก่อนขึ้นพูด
- [ ] ทดสอบในห้องจริง: เปิดลำโพงแล้ว AI ได้ยินเสียงตัวเองจนพูดแทรกตัวเองไหม → ถ้าใช่ ใช้หูฟัง/ลำโพงบลูทูธต่อเข้ามือถือ
- [ ] เลือกด่านเดโม: **ตำรวจ** (เห็นภาพชัด) หรือ **สรรพากร** (ว้าวเพราะไม่น่าสงสัย)
- [ ] ลำดับเดโม: ให้อาจารย์รับสาย → คุย 1–2 นาที → วางสาย → เปิด X-Ray ชี้ "ควรวางสายตรงนี้" + กราฟ → leaderboard
- [ ] แผนสำรอง: อัดหน้าจอสายเดโมที่ดีไว้ 1 คลิป + X-Ray ของ `fixtures/calls/*` (กรณีเน็ต/โควตามีปัญหา)
- [ ] โควตา free tier: อย่าให้ทั้งห้องลองพร้อมกัน — rate limit อยู่ที่ระดับ project ของ Gemini

## 7. ระบบผู้เล่น — guest + login Google (Phase 1 ของ `docs/GAME_SPEC.md`)

**A. Database**
1. Supabase → **SQL Editor** → วางทั้งไฟล์ `supabase/migrations/002_game.sql` → **Run** (ได้ตาราง `profiles`, `plays`, `badges`)

**B. Guest (anonymous sign-in)**
2. **Authentication → Sign In / Providers → Anonymous Sign-Ins** → เปิด
3. **Authentication → Rate Limits** → "anonymous sign-ins" ค่าเริ่มต้น 30 ครั้ง/ชม./IP — **ทั้งห้องเรียนใช้ Wi-Fi เดียวกัน = IP เดียว** → เพิ่มเป็น ~300 ก่อนเดโม/ทดสอบกับเพื่อน
4. (แนะนำภายหลัง) เปิด CAPTCHA (Turnstile) กันคนสร้าง guest ถล่ม — ต้องแก้โค้ดส่ง captcha token เพิ่ม บอก Claude ก่อนเปิด

**C. Login Google**
5. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → **OAuth consent screen** (External, ชื่อแอป ScamCall) → **Credentials → Create OAuth client ID** (Web application)
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (ดู URL นี้ได้ในหน้า Google provider ของ Supabase)
6. Supabase → **Authentication → Sign In / Providers → Google** → เปิด → ใส่ Client ID + Client Secret
7. Supabase → **Authentication → Sign In / Providers** (ส่วน settings) → เปิด **Allow manual linking** (ให้ guest ผูก Google ได้)
8. Supabase → **Authentication → URL Configuration**
   - Site URL: `https://scamcall.vercel.app`
   - Redirect URLs: `http://localhost:3000/auth/callback` และ `https://scamcall.vercel.app/auth/callback`

**D. Env**
9. Supabase → **Project Settings → API Keys** → คัดลอก **Publishable key** (`sb_publishable_...`)
10. ใส่ใน `.env.local` และ Vercel (Production + Preview):
    - `NEXT_PUBLIC_SUPABASE_URL` = `https://<project-ref>.supabase.co`
    - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...`
    - ค่า `NEXT_PUBLIC_*` ถูกฝังตอน build → บน Vercel ต้อง **Redeploy** หลังเพิ่ม

**E. ทดสอบ**
- เปิดหน้าแรก → ยินยอม → ได้หน้า "สร้างตัวละครของคุณ" → บันทึก → เล่น 1 สาย → X-Ray ต้องขึ้น XP + เหรียญ "สายแรกในชีวิต"
- `/me` → "เก็บความคืบหน้าด้วย Google" → login → กลับมา `/me` ต้องขึ้น "เชื่อมกับ Google แล้ว" และ XP เดิมอยู่ครบ
- `/hall` → เห็นฉายาตัวเอง (บอร์ดภูมิคุ้มกันต้องเล่น ≥ 3 สาย)
- Supabase → Authentication → Users: guest แสดงเป็น "Anonymous"

## ⚠️ เงื่อนไข Gemini API ที่ต้องรู้ก่อนเปิดให้คนอื่นใช้ (เช็ก ai.google.dev/gemini-api/terms เมื่อ 2026-10-11)

1. **Free tier (Unpaid Services):** Google อาจใช้ข้อมูลที่ส่งเข้าไป (เสียงที่คุย, transcript ที่ส่งวิเคราะห์) และคำตอบ ไปปรับปรุงผลิตภัณฑ์/train โมเดล และ**อาจมีคนอ่านตรวจ** (ตัดการเชื่อมโยงกับบัญชีก่อน) — เงื่อนไขแนะนำว่าไม่ควรส่งข้อมูลส่วนตัว
   - ระบบเราไม่เก็บเสียง + mask ตัวเลขก่อนวิเคราะห์ + บอกผู้เล่นให้แต่งข้อมูล แต่ **เสียงสดยังไปถึง Google**
   - **Paid tier:** Google ไม่ใช้ prompt/คำตอบไปปรับปรุงผลิตภัณฑ์ (เก็บ log ชั่วคราวเพื่อตรวจการใช้ผิดนโยบายเท่านั้น)
   - **เลือกแล้ว (2026-10-11): ใช้ free tier + แจ้งผู้ใช้** — หน้ายินยอมบอกว่าเสียง/บทสนทนาถูกส่งไป Google ซึ่งอาจนำไปปรับปรุงบริการและอาจมีคนตรวจอ่าน และช่องที่ต้องติ๊กระบุเรื่องนี้ (`lib/copy.ts`)
   - ถ้าภายหลังเปิด billing ให้แก้ข้อความใน `DISCLAIMER_POINTS` ให้ตรงกับ paid tier
2. **อายุ:** ผู้ใช้ API ต้องอายุ **18 ปีขึ้นไป** และห้ามใช้ในแอปที่มีแนวโน้มให้คนอายุต่ำกว่า 18 เข้าใช้ → หน้ายินยอมมีช่องบังคับ "ฉันอายุ 18 ปีขึ้นไป" แล้ว · ทดสอบกับเพื่อนที่อายุ 18+ เท่านั้น
