-- ============================================================
-- Catalyst Society - Skema Database Supabase
-- Jalankan seluruh berkas ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- ---------- 1. PROFIL PENGGUNA (Catalyst Passport) ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  catalyst_id   text unique not null,
  full_name     text not null,
  headline      text,
  location      text,
  about         text,
  avatar_url    text,
  channel       text check (channel in ('investments','ai_technology','business','builders','social_impact')),
  journey_stage text not null default 'explorer'
                check (journey_stage in ('explorer','connector','builder','challenger','contributor','innovator')),
  cata_points   integer not null default 0,
  is_verified   boolean not null default false,
  links         jsonb not null default '{}'::jsonb,
  skills        text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- 2. KOMUNITAS ----------
create table if not exists public.communities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  channel     text not null,
  description text,
  logo_url    text,
  member_count integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid references public.communities on delete cascade,
  user_id      uuid references public.profiles on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

-- ---------- 3. BADGE ----------
create table if not exists public.badges (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  description text,
  icon        text
);

create table if not exists public.user_badges (
  user_id   uuid references public.profiles on delete cascade,
  badge_id  uuid references public.badges on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------- 4. JOURNEY ----------
create table if not exists public.journey_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles on delete cascade,
  stage      text not null,
  title      text not null,
  detail     text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- 5. CATALYST FINDER: peluang ----------
create table if not exists public.opportunities (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references public.profiles on delete cascade,
  kind         text not null check (kind in ('hiring','partner','fundraising','support')),
  title        text not null,
  org_name     text,
  category     text,
  description  text,
  location     text,
  tags         text[] not null default '{}',
  funding_goal   numeric,
  funding_raised numeric not null default 0,
  cover_url    text,
  is_open      boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.opportunity_applications (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities on delete cascade,
  user_id        uuid references public.profiles on delete cascade,
  message        text,
  status         text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at     timestamptz not null default now(),
  unique (opportunity_id, user_id)
);

-- ---------- 6. CATALYST ACADEMY ----------
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique not null,
  category     text not null,
  description  text,
  cover_url    text,
  lesson_count integer not null default 0,
  hours        numeric not null default 0,
  rating       numeric not null default 0,
  xp_reward    integer not null default 100,
  is_premium   boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.enrollments (
  user_id      uuid references public.profiles on delete cascade,
  course_id    uuid references public.courses on delete cascade,
  progress     integer not null default 0 check (progress between 0 and 100),
  completed_at timestamptz,
  started_at   timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles on delete cascade,
  course_id   uuid references public.courses on delete set null,
  title       text not null,
  issuer      text not null default 'Catalyst Academy',
  cert_code   text unique not null,
  issued_at   date not null default current_date
);

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  speaker     text,
  kind        text not null default 'webinar',
  starts_at   timestamptz not null,
  location    text,
  created_at  timestamptz not null default now()
);

create table if not exists public.event_registrations (
  event_id uuid references public.events on delete cascade,
  user_id  uuid references public.profiles on delete cascade,
  primary key (event_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles                enable row level security;
alter table public.communities             enable row level security;
alter table public.community_members       enable row level security;
alter table public.badges                  enable row level security;
alter table public.user_badges             enable row level security;
alter table public.journey_events          enable row level security;
alter table public.opportunities           enable row level security;
alter table public.opportunity_applications enable row level security;
alter table public.courses                 enable row level security;
alter table public.enrollments             enable row level security;
alter table public.certificates            enable row level security;
alter table public.events                  enable row level security;
alter table public.event_registrations     enable row level security;

-- Profil: semua boleh baca, hanya pemilik yang boleh ubah
drop policy if exists "profil dapat dibaca semua" on public.profiles;
create policy "profil dapat dibaca semua" on public.profiles for select using (true);

drop policy if exists "pengguna menyisipkan profil sendiri" on public.profiles;
create policy "pengguna menyisipkan profil sendiri" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "pengguna mengubah profil sendiri" on public.profiles;
create policy "pengguna mengubah profil sendiri" on public.profiles for update using (auth.uid() = id);

-- Katalog publik: siapa pun boleh baca
drop policy if exists "katalog komunitas publik" on public.communities;
create policy "katalog komunitas publik" on public.communities for select using (true);

drop policy if exists "katalog badge publik" on public.badges;
create policy "katalog badge publik" on public.badges for select using (true);

drop policy if exists "katalog kursus publik" on public.courses;
create policy "katalog kursus publik" on public.courses for select using (true);

drop policy if exists "katalog event publik" on public.events;
create policy "katalog event publik" on public.events for select using (true);

drop policy if exists "peluang terbuka publik" on public.opportunities;
create policy "peluang terbuka publik" on public.opportunities for select using (true);

drop policy if exists "pengguna membuat peluang" on public.opportunities;
create policy "pengguna membuat peluang" on public.opportunities for insert with check (auth.uid() = author_id);

drop policy if exists "pemilik mengubah peluang" on public.opportunities;
create policy "pemilik mengubah peluang" on public.opportunities for update using (auth.uid() = author_id);

-- Data milik pengguna: hanya pemiliknya
drop policy if exists "keanggotaan milik sendiri" on public.community_members;
create policy "keanggotaan milik sendiri" on public.community_members for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "badge milik sendiri dapat dibaca semua" on public.user_badges;
create policy "badge milik sendiri dapat dibaca semua" on public.user_badges for select using (true);

drop policy if exists "badge disisipkan pemilik" on public.user_badges;
create policy "badge disisipkan pemilik" on public.user_badges for insert with check (auth.uid() = user_id);

drop policy if exists "journey dapat dibaca semua" on public.journey_events;
create policy "journey dapat dibaca semua" on public.journey_events for select using (true);

drop policy if exists "journey ditulis pemilik" on public.journey_events;
create policy "journey ditulis pemilik" on public.journey_events for insert with check (auth.uid() = user_id);

drop policy if exists "lamaran milik sendiri" on public.opportunity_applications;
create policy "lamaran milik sendiri" on public.opportunity_applications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "enrollment milik sendiri" on public.enrollments;
create policy "enrollment milik sendiri" on public.enrollments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sertifikat dapat dibaca semua" on public.certificates;
create policy "sertifikat dapat dibaca semua" on public.certificates for select using (true);

drop policy if exists "sertifikat disisipkan pemilik" on public.certificates;
create policy "sertifikat disisipkan pemilik" on public.certificates for insert with check (auth.uid() = user_id);

drop policy if exists "registrasi event milik sendiri" on public.event_registrations;
create policy "registrasi event milik sendiri" on public.event_registrations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: buat profil otomatis saat pengguna mendaftar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_code text;
begin
  new_code := 'CAT-' || upper(substr(replace(new.id::text,'-',''), 1, 6));

  insert into public.profiles (id, catalyst_id, full_name, channel, cata_points)
  values (
    new.id,
    new_code,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'channel', 'business'),
    50
  );

  insert into public.journey_events (user_id, stage, title, detail)
  values (new.id, 'explorer', 'Explorer', 'Bergabung dengan Catalyst Society');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- DATA AWAL (katalog)
-- ============================================================
insert into public.badges (code, name, description, icon) values
  ('first_step',         'First Step',         'Menyelesaikan pendaftaran Catalyst Passport', 'spark'),
  ('first_community',    'First Community',    'Bergabung ke komunitas pertama',              'users'),
  ('community_explorer', 'Community Explorer', 'Bergabung ke lima komunitas',                 'search'),
  ('ecosystem_native',   'Ecosystem Native',   'Aktif di tiga channel industri',              'globe'),
  ('first_project',      'First Project',      'Membuat project pertama di Labs',             'rocket'),
  ('certified',          'Certified',          'Menyelesaikan kursus bersertifikat',          'badge'),
  ('builder',            'Builder',            'Mencapai tahap Builder pada Journey',         'cube')
on conflict (code) do nothing;

insert into public.communities (name, slug, channel, description) values
  ('Bisa AI',              'bisa-ai',              'ai_technology',  'Komunitas praktisi dan pembelajar AI di Indonesia.'),
  ('Blockplay',            'blockplay',            'ai_technology',  'Komunitas Web3, blockchain, dan teknologi terdesentralisasi.'),
  ('Young On Top',         'young-on-top',         'business',       'Menyatukan anak muda Indonesia untuk bertumbuh bersama.'),
  ('Bisnis Muda',          'bisnis-muda',          'business',       'Wadah pebisnis muda berbagi strategi dan kolaborasi.'),
  ('AICO',                 'aico',                 'business',       'Komunitas inovasi produk dan kewirausahaan.'),
  ('Tradix Community',     'tradix-community',     'investments',    'Diskusi saham, kripto, forex, dan prop firm.'),
  ('Investor Saham Pemula','investor-saham-pemula','investments',    'Belajar investasi saham dari nol bersama mentor.'),
  ('Build Club',           'build-club',           'builders',       'Tempat developer membangun produk nyata bersama.'),
  ('Nusantara Code',       'nusantara-code',       'builders',       'Komunitas pengembang perangkat lunak Nusantara.'),
  ('Young Leaders Indonesia','young-leaders-indonesia','social_impact','Kepemimpinan muda untuk dampak sosial berkelanjutan.')
on conflict (slug) do nothing;

insert into public.courses (title, slug, category, description, lesson_count, hours, rating, xp_reward, is_premium) values
  ('Investasi Untuk Pemula',        'investasi-untuk-pemula',        'Investasi', 'Strategi investasi cerdas untuk masa depan finansial yang bebas.', 12, 8.5, 4.9, 400, false),
  ('AI for Everyone',               'ai-for-everyone',               'AI',        'Machine Learning Fundamentals untuk semua latar belakang.',        15, 11.0, 4.8, 500, false),
  ('Membangun Mindset Pebisnis',    'membangun-mindset-pebisnis',    'Business',  'Bangun mindset pebisnis dan kembangkan bisnis yang berdampak.',    18, 12.5, 4.9, 550, true),
  ('Coding Dari Dasar',             'coding-dari-dasar',             'Coding',    'Belajar coding dari dasar hingga mahir bangun aplikasi.',          20, 16.0, 4.8, 600, true),
  ('Analisis Teknikal Lanjutan',    'analisis-teknikal-lanjutan',    'Investasi', 'Membaca struktur pasar dan mengelola risiko secara disiplin.',      10, 7.0, 4.7, 380, true),
  ('Product Design Fundamental',    'product-design-fundamental',    'Coding',    'Merancang produk digital dari riset hingga prototipe.',            14, 9.5, 4.8, 450, false)
on conflict (slug) do nothing;

insert into public.events (title, speaker, kind, starts_at, location) values
  ('Webinar: Future of AI in Business', 'Andi Wijaya',    'webinar',  now() + interval '18 days', 'Online'),
  ('Live Class: Investing for Beginners','Rivan Kurniawan','live_class', now() + interval '23 days', 'Online'),
  ('Catalyst Summit 2027',              'Catalyst Society','summit',  now() + interval '210 days', 'Jakarta')
on conflict do nothing;
