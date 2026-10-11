-- ScamCall — ตารางสำหรับ leaderboard และผลทดสอบกับเพื่อน (docs/SPEC.md ข้อ 4)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางทั้งไฟล์ → Run
-- ไม่มี transcript / ชื่อจริง / ข้อมูลติดต่อในตารางใดเลย

create table if not exists public.leaderboard (
  id          bigint generated always as identity primary key,
  session_id  text        not null unique,             -- หนึ่งสายส่งได้ครั้งเดียว
  nickname    text        not null check (char_length(nickname) between 2 and 20),
  level_id    text        not null,
  score       smallint    not null check (score between 0 and 100),
  hangup_t    real        not null check (hangup_t >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists leaderboard_rank_idx
  on public.leaderboard (level_id, score desc, hangup_t asc);

create table if not exists public.playtest_runs (
  id                bigint generated always as identity primary key,
  session_id        text        not null unique,
  tester_code       text        not null check (tester_code ~ '^[A-Z0-9-]{1,12}$'),  -- เช่น P01 ไม่ใช่ชื่อจริง
  round             smallint    not null check (round between 1 and 5),
  level_id          text        not null,
  ended_by          text        not null check (ended_by in ('player', 'timeout', 'error', 'declined')),
  hangup_t          real        not null check (hangup_t >= 0),
  should_hang_up_at real        not null check (should_hang_up_at >= 0),
  score             smallint    not null check (score between 0 and 100),
  grade             text        not null check (grade in ('strong', 'close', 'scammed')),
  complied          boolean     not null,
  leaked_count      smallint    not null check (leaked_count >= 0),
  created_at        timestamptz not null default now()
);

-- เปิด RLS โดยไม่มี policy = publishable/anon key อ่านเขียนไม่ได้เลย
-- แอปเขียน/อ่านผ่าน API route ฝั่ง server ด้วย secret key เท่านั้น (secret key ข้าม RLS)
alter table public.leaderboard   enable row level security;
alter table public.playtest_runs enable row level security;
