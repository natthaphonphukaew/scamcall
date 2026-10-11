-- ScamCall: Campus — โปรไฟล์ผู้เล่น / ผลการเล่น / เหรียญ (docs/GAME_SPEC.md ข้อ 4–8)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางทั้งไฟล์ → Run (รันหลัง 001)
-- ผู้เล่นทุกคน (รวม guest) อยู่ใน auth.users — ลบผู้เล่น = ข้อมูลเกมหายตาม (on delete cascade)
-- ไม่มี transcript / ชื่อจริง / อีเมลในตารางเหล่านี้

create table if not exists public.profiles (
  id                  uuid        primary key references auth.users (id) on delete cascade,
  alias_parts         smallint[]  not null check (array_length(alias_parts, 1) = 3),  -- index ชิ้นส่วนฉายา (lib/game/alias.ts)
  avatar              text        not null check (char_length(avatar) between 1 and 20),
  show_on_funny_board boolean     not null default false,                             -- opt-in บอร์ดขำ
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.plays (
  id                bigint generated always as identity primary key,
  session_id        text        not null unique,                                      -- หนึ่งสายนับได้ครั้งเดียว
  user_id           uuid        not null references auth.users (id) on delete cascade,
  level_id          text        not null,
  channel           text        not null check (channel in ('call', 'chat')),
  ended_by          text        not null check (ended_by in ('player', 'timeout', 'error', 'declined')),
  score             smallint    not null check (score between 0 and 100),
  grade             text        not null check (grade in ('strong', 'close', 'scammed')),
  complied          boolean     not null,
  said_callback     boolean     not null,
  leaked_count      smallint    not null check (leaked_count >= 0),
  hangup_t          real        not null check (hangup_t >= 0),
  should_hang_up_at real        not null check (should_hang_up_at >= 0),
  xp                integer     not null check (xp >= 0),
  saved             boolean     not null,                                             -- ช่วย NPC สำเร็จ
  created_at        timestamptz not null default now()
);

create index if not exists plays_user_idx  on public.plays (user_id, created_at);
create index if not exists plays_level_idx on public.plays (level_id);

create table if not exists public.badges (
  user_id   uuid        not null references auth.users (id) on delete cascade,
  badge_id  text        not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- RLS เปิด ไม่มี policy = browser (publishable key) อ่าน/เขียนตรงไม่ได้
-- แอปอ่าน/เขียนผ่าน API route ฝั่ง server ด้วย secret key + user id จาก getClaims() เท่านั้น
alter table public.profiles enable row level security;
alter table public.plays    enable row level security;
alter table public.badges   enable row level security;

-- (ไม่บังคับ) ลบ guest ที่ไม่ได้เล่นนานเกิน 30 วัน — รันเองใน SQL Editor เมื่อต้องการ:
-- delete from auth.users where is_anonymous is true and last_sign_in_at < now() - interval '30 days';
