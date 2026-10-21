-- ============================================================
-- Catalyst Society — skema awal
--
-- Jalankan sekali di project Supabase baru:
--   Supabase Dashboard > SQL Editor > New query > tempel seluruh berkas > Run
--
-- Prinsip yang dipegang skema ini:
--
--   1. Pengguna hanya bisa menulis kolom yang memang miliknya.
--      Poin, status verifikasi, tahap journey, dan lencana tidak bisa
--      diubah dari browser; semuanya lewat fungsi di schema private
--      yang tidak terekspos ke API.
--
--   2. Profil publik terbaca siapa saja; profil privat hanya oleh
--      pemiliknya. Semua tabel turunan (projek, sertifikat, komunitas,
--      koneksi) mengikuti keterlihatan profil pemiliknya.
--
--   3. Tidak ada kolom yang menyimpan URL tanpa diperiksa. Setiap URL
--      wajib http(s), jadi javascript: dan data: tidak bisa masuk ke
--      atribut href.
--
--   4. CV disimpan di bucket privat. Terbaca publik hanya kalau
--      pemiliknya memilih "publik" dan profilnya publik.
-- ============================================================

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ------------------------------------------------------------
-- Pemeriksa URL
-- ------------------------------------------------------------
create or replace function public.is_safe_url(u text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select u is null
      or u = ''
      or (length(u) <= 500 and u ~* '^https?://[^[:space:]<>"''`]+$');
$$;

-- Tautan sosial disimpan sebagai objek {kanal: url}. Kunci dibatasi,
-- nilainya wajib URL aman.
create or replace function public.links_are_valid(l jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(l) = 'object'
     and (select count(*) from jsonb_object_keys(l)) <= 12
     and not exists (
       select 1 from jsonb_each(l) e
       where e.key not in ('linkedin','instagram','twitter','youtube','tiktok',
                           'github','website','portfolio','facebook','telegram')
          or jsonb_typeof(e.value) <> 'string'
          or not public.is_safe_url(e.value #>> '{}')
     );
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- 1. PROFIL
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  catalyst_id   text unique not null,
  slug          text unique not null
                check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  full_name     text not null check (char_length(full_name) between 1 and 80),
  headline      text check (char_length(headline) <= 120),
  location      text check (char_length(location) <= 80),
  about         text check (char_length(about) <= 1200),
  -- avatar_path: berkas di bucket avatars. avatar_url: foto dari penyedia
  -- login (Google). Tampilan mendahulukan avatar_path. Path wajib berada
  -- di folder milik pengguna sendiri, supaya profil tidak bisa menampilkan
  -- berkas orang lain sebagai fotonya.
  avatar_path   text check (
                  avatar_path is null or (
                    char_length(avatar_path) <= 200
                    and avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$'
                    and split_part(avatar_path, '/', 1) = id::text
                    and position('..' in avatar_path) = 0)),
  -- Hanya foto akun Google. URL bebas bisa dipakai sebagai piksel
  -- pelacak yang dimuat browser setiap pengunjung profil.
  avatar_url    text check (
                  public.is_safe_url(avatar_url)
                  and (avatar_url is null or avatar_url like 'https://lh3.googleusercontent.com/%')),
  channel       text check (channel in ('investments','ai','business','builder','impact')),
  journey_stage text not null default 'explorer'
                check (journey_stage in ('explorer','connector','builder','challenger','contributor','innovator')),
  cata_points   integer not null default 0 check (cata_points >= 0),
  is_verified   boolean not null default false,
  is_public     boolean not null default true,
  links         jsonb not null default '{}'::jsonb check (public.links_are_valid(links)),
  skills        text[] not null default '{}'
                check (cardinality(skills) <= 20),
  roles         text[] not null default '{}'
                check (cardinality(roles) <= 10),
  -- CV opsional. Hanya nama berkas yang disimpan di sini; isinya ada di
  -- bucket privat cvs pada path <id>/cv.pdf.
  -- Nama tampilan CV saja; berkasnya selalu <uid>/cv.pdf.
  cv_file_name  text check (cv_file_name ~* '^[^/]{1,116}[.]pdf$' and strpos(cv_file_name, chr(92)) = 0),
  cv_visibility text not null default 'private' check (cv_visibility in ('private','public')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

alter table public.profiles enable row level security;

create policy "profil publik atau milik sendiri" on public.profiles
  for select using (is_public or id = (select auth.uid()));

create policy "pemilik mengubah profil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- RLS menjawab "baris mana"; hak kolom menjawab "kolom mana".
-- Profil dibuat oleh trigger, bukan oleh browser, jadi tidak ada hak
-- insert. Kolom poin, verifikasi, tahap, dan catalyst_id tidak pernah
-- diberikan ke pengguna.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant update (full_name, headline, location, about, avatar_path, avatar_url,
              channel, is_public, links, skills, roles, cv_file_name,
              cv_visibility, slug)
  on table public.profiles to authenticated;

-- Dipakai kebijakan tabel turunan: baris terlihat kalau profil
-- pemiliknya publik, atau yang melihat adalah pemiliknya sendiri.
create or replace function public.profile_visible(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and (p.is_public or p.id = (select auth.uid()))
  );
$$;

-- ============================================================
-- 2. KATALOG: komunitas dan lencana
-- ============================================================
create table public.communities (
  slug    text primary key,
  name    text not null,
  channel text not null
);
alter table public.communities enable row level security;
create policy "katalog komunitas terbuka" on public.communities for select using (true);
revoke all on table public.communities from anon, authenticated;
grant select on table public.communities to anon, authenticated;

create table public.badges (
  code        text primary key,
  name        text not null,
  description text,
  icon        text not null
);
alter table public.badges enable row level security;
create policy "katalog lencana terbuka" on public.badges for select using (true);
revoke all on table public.badges from anon, authenticated;
grant select on table public.badges to anon, authenticated;

-- ============================================================
-- 3. CAPAIAN: poin, lencana, journey
--    Tidak ada satu pun yang bisa ditulis dari browser.
-- ============================================================
create table public.point_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles on delete cascade,
  delta      integer not null,
  reason     text not null,
  created_at timestamptz not null default now(),
  -- Tiap alasan hanya dihadiahkan sekali. Menghapus lalu menambah ulang
  -- projek tidak memberi poin lagi.
  unique (user_id, reason)
);
alter table public.point_events enable row level security;
create policy "riwayat poin milik sendiri" on public.point_events
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on table public.point_events from anon, authenticated;
grant select on table public.point_events to authenticated;

create table public.user_badges (
  user_id    uuid not null references public.profiles on delete cascade,
  badge_code text not null references public.badges on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_code)
);
alter table public.user_badges enable row level security;
create policy "lencana mengikuti profil" on public.user_badges
  for select using (public.profile_visible(user_id));
revoke all on table public.user_badges from anon, authenticated;
grant select on table public.user_badges to anon, authenticated;

create table public.journey_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles on delete cascade,
  stage       text not null
              check (stage in ('explorer','connector','builder','challenger','contributor','innovator')),
  title       text not null,
  detail      text,
  occurred_at timestamptz not null default now(),
  unique (user_id, stage)
);
alter table public.journey_events enable row level security;
create policy "journey mengikuti profil" on public.journey_events
  for select using (public.profile_visible(user_id));
revoke all on table public.journey_events from anon, authenticated;
grant select on table public.journey_events to anon, authenticated;

-- Satu pintu untuk semua hadiah. Ada di schema private, jadi tidak bisa
-- dipanggil lewat API; hanya trigger di bawah yang memanggilnya.
create or replace function private.award(
  p_user    uuid,
  p_reason  text,
  p_delta   integer,
  p_badge   text default null,
  p_stage   text default null,
  p_title   text default null,
  p_detail  text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
  v_order text[] := array['explorer','connector','builder','challenger','contributor','innovator'];
begin
  insert into public.point_events (user_id, delta, reason)
  values (p_user, p_delta, p_reason)
  on conflict (user_id, reason) do nothing;
  get diagnostics v_inserted = row_count;

  -- Alasan ini sudah pernah dihadiahkan: berhenti tanpa efek apa pun.
  if v_inserted = 0 then
    return;
  end if;

  update public.profiles
     set cata_points = cata_points + p_delta
   where id = p_user;

  if p_badge is not null then
    insert into public.user_badges (user_id, badge_code)
    values (p_user, p_badge)
    on conflict do nothing;
  end if;

  if p_stage is not null then
    insert into public.journey_events (user_id, stage, title, detail)
    values (p_user, p_stage, coalesce(p_title, initcap(p_stage)), p_detail)
    on conflict (user_id, stage) do nothing;

    -- Tahap hanya naik, tidak pernah turun.
    update public.profiles
       set journey_stage = p_stage
     where id = p_user
       and array_position(v_order, p_stage) > array_position(v_order, journey_stage);
  end if;
end;
$$;
revoke all on function private.award(uuid, text, integer, text, text, text, text) from public, anon, authenticated;

-- ============================================================
-- 4. KEANGGOTAAN KOMUNITAS
-- ============================================================
create table public.community_members (
  user_id        uuid not null default auth.uid() references public.profiles on delete cascade,
  community_slug text not null references public.communities on delete cascade,
  joined_at      timestamptz not null default now(),
  primary key (user_id, community_slug)
);
alter table public.community_members enable row level security;
create policy "keanggotaan mengikuti profil" on public.community_members
  for select using (public.profile_visible(user_id));
create policy "pemilik bergabung" on public.community_members
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "pemilik keluar" on public.community_members
  for delete to authenticated using (user_id = (select auth.uid()));
revoke all on table public.community_members from anon, authenticated;
grant select on table public.community_members to anon, authenticated;
grant insert (community_slug), delete on table public.community_members to authenticated;

create or replace function private.on_community_joined()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  select count(*) into n from public.community_members where user_id = new.user_id;
  if n >= 1 then
    perform private.award(new.user_id, 'first_community', 20, 'first_community');
  end if;
  if n >= 3 then
    perform private.award(new.user_id, 'connector', 30, null,
      'connector', 'Connector', 'Bergabung ke tiga komunitas');
  end if;
  if n >= 5 then
    perform private.award(new.user_id, 'community_explorer', 20, 'community_explorer');
  end if;
  return new;
end;
$$;
create trigger community_joined after insert on public.community_members
  for each row execute function private.on_community_joined();

-- ============================================================
-- 5. PROJEK
-- ============================================================
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  description   text check (char_length(description) <= 600),
  role          text check (char_length(role) <= 60),
  started_on    date,
  ended_on      date,
  url           text check (public.is_safe_url(url)),
  collaborators integer not null default 0 check (collaborators between 0 and 100000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ended_on is null or started_on is null or ended_on >= started_on)
);
create index projects_user_idx on public.projects (user_id);
create trigger projects_touch before update on public.projects
  for each row execute function private.touch_updated_at();

alter table public.projects enable row level security;
create policy "projek mengikuti profil" on public.projects
  for select using (public.profile_visible(user_id));
create policy "pemilik menambah projek" on public.projects
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "pemilik mengubah projek" on public.projects
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "pemilik menghapus projek" on public.projects
  for delete to authenticated using (user_id = (select auth.uid()));
revoke all on table public.projects from anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant insert (title, description, role, started_on, ended_on, url, collaborators),
      update (title, description, role, started_on, ended_on, url, collaborators),
      delete
  on table public.projects to authenticated;

create or replace function private.on_project_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.projects where user_id = new.user_id) > 50 then
    raise exception 'Batas 50 projek per profil tercapai' using errcode = 'check_violation';
  end if;
  perform private.award(new.user_id, 'first_project', 50, 'first_project',
    'builder', 'Builder', 'Membuat projek pertama');
  perform private.award(new.user_id, 'builder_badge', 0, 'builder');
  return new;
end;
$$;
create trigger project_added after insert on public.projects
  for each row execute function private.on_project_added();

-- ============================================================
-- 6. SERTIFIKAT
--    source = 'self'     ditambahkan pengguna, tidak terverifikasi
--    source = 'catalyst' diterbitkan Catalyst Academy, hanya lewat admin
-- ============================================================
create table public.certificates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references public.profiles on delete cascade,
  source         text not null default 'self' check (source in ('self','catalyst')),
  title          text not null check (char_length(title) between 1 and 160),
  issuer         text not null check (char_length(issuer) between 1 and 120),
  issued_on      date,
  credential_id  text check (char_length(credential_id) <= 80),
  credential_url text check (public.is_safe_url(credential_url)),
  -- Sama seperti avatar_path: hanya berkas di folder milik sendiri.
  image_path     text check (
                   image_path is null or (
                     char_length(image_path) <= 200
                     and image_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$'
                     and split_part(image_path, '/', 1) = user_id::text
                     and position('..' in image_path) = 0)),
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index certificates_user_idx on public.certificates (user_id);
create trigger certificates_touch before update on public.certificates
  for each row execute function private.touch_updated_at();

alter table public.certificates enable row level security;
create policy "sertifikat mengikuti profil" on public.certificates
  for select using (public.profile_visible(user_id));
create policy "pemilik menambah sertifikat" on public.certificates
  for insert to authenticated
  with check (user_id = (select auth.uid()) and source = 'self' and not is_verified);
-- Sertifikat terbitan Catalyst tidak bisa diubah atau dihapus pemiliknya:
-- itu catatan resmi, bukan klaim pribadi.
create policy "pemilik mengubah sertifikat sendiri" on public.certificates
  for update to authenticated
  using (user_id = (select auth.uid()) and source = 'self')
  with check (user_id = (select auth.uid()) and source = 'self' and not is_verified);
create policy "pemilik menghapus sertifikat sendiri" on public.certificates
  for delete to authenticated
  using (user_id = (select auth.uid()) and source = 'self');
revoke all on table public.certificates from anon, authenticated;
grant select on table public.certificates to anon, authenticated;
grant insert (title, issuer, issued_on, credential_id, credential_url, image_path),
      update (title, issuer, issued_on, credential_id, credential_url, image_path),
      delete
  on table public.certificates to authenticated;

create or replace function private.on_certificate_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.certificates where user_id = new.user_id) > 100 then
    raise exception 'Batas 100 sertifikat per profil tercapai' using errcode = 'check_violation';
  end if;
  -- Lencana "Certified" hanya untuk sertifikat terverifikasi. Menambah
  -- sertifikat sendiri tidak memberi lencana; siapa pun bisa mengetik judul.
  if new.is_verified then
    perform private.award(new.user_id, 'certified', 40, 'certified');
  end if;
  return new;
end;
$$;
create trigger certificate_added after insert on public.certificates
  for each row execute function private.on_certificate_added();

-- ============================================================
-- 7. KONEKSI (mengikuti)
-- ============================================================
create table public.connections (
  follower_id  uuid not null default auth.uid() references public.profiles on delete cascade,
  following_id uuid not null references public.profiles on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index connections_following_idx on public.connections (following_id);

alter table public.connections enable row level security;
create policy "koneksi terlihat" on public.connections
  for select using (
    follower_id = (select auth.uid())
    or following_id = (select auth.uid())
    or (public.profile_visible(follower_id) and public.profile_visible(following_id))
  );
-- Hanya bisa mengikuti profil publik.
create policy "pemilik mengikuti" on public.connections
  for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = following_id and p.is_public)
  );
create policy "pemilik berhenti mengikuti" on public.connections
  for delete to authenticated using (follower_id = (select auth.uid()));
revoke all on table public.connections from anon, authenticated;
grant select on table public.connections to anon, authenticated;
grant insert (following_id), delete on table public.connections to authenticated;

-- ============================================================
-- 8. KUNJUNGAN PROFIL (untuk Analytics)
-- ============================================================
create table public.profile_views (
  id         bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles on delete cascade,
  viewer_id  uuid,
  viewed_on  date not null default current_date,
  created_at timestamptz not null default now()
);
create index profile_views_profile_idx on public.profile_views (profile_id, viewed_on);
-- Satu kunjungan per penonton masuk per hari.
create unique index profile_views_once_a_day
  on public.profile_views (profile_id, viewer_id, viewed_on)
  where viewer_id is not null;

alter table public.profile_views enable row level security;
create policy "kunjungan milik sendiri" on public.profile_views
  for select to authenticated using (profile_id = (select auth.uid()));
revoke all on table public.profile_views from anon, authenticated;
-- viewer_id sengaja tidak diberikan: pemilik profil melihat jumlah
-- kunjungan, bukan siapa yang berkunjung.
grant select (id, profile_id, viewed_on) on table public.profile_views to authenticated;

create or replace function public.record_profile_view(p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.profiles where slug = p_slug and is_public;
  if v_id is null or v_id = (select auth.uid()) then
    return;
  end if;
  insert into public.profile_views (profile_id, viewer_id)
  values (v_id, (select auth.uid()))
  on conflict do nothing;
end;
$$;
revoke all on function public.record_profile_view(text) from public;
grant execute on function public.record_profile_view(text) to anon, authenticated;

-- ============================================================
-- 9. HAPUS AKUN
--    Berkas di storage dihapus lebih dulu oleh aplikasi lewat API
--    storage; baris storage.objects tidak boleh dihapus lewat SQL.
-- ============================================================
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Belum masuk' using errcode = 'insufficient_privilege';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ============================================================
-- 10. PENGGUNA BARU
--     Dijalankan untuk pendaftaran email maupun Google.
-- ============================================================
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code   text;
  v_name   text;
  v_avatar text;
  v_try    integer := 0;
begin
  -- Google mengirim full_name dan name; pendaftaran email mengirim
  -- full_name dari formulir. Cadangan terakhir: bagian depan email.
  v_name := left(coalesce(
    nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Builder'), 80);

  v_avatar := coalesce(new.raw_user_meta_data->>'avatar_url',
                       new.raw_user_meta_data->>'picture');
  if not public.is_safe_url(v_avatar)
     or v_avatar not like 'https://lh3.googleusercontent.com/%' then
    v_avatar := null;
  end if;

  -- Skema lama memakai 6 karakter pertama UUID dengan kolom unique. Pada
  -- sekitar 5.000 pengguna peluang tabrakannya sudah mendekati setengah,
  -- dan tabrakan di trigger ini menggagalkan pendaftaran itu sendiri.
  -- Di sini kode diacak ulang sampai unik, dengan cadangan UUID penuh.
  loop
    v_try := v_try + 1;
    v_code := 'CAT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    if v_try > 25 then
      v_code := 'CAT-' || upper(replace(new.id::text, '-', ''));
    end if;
    begin
      insert into public.profiles (id, catalyst_id, slug, full_name, avatar_url)
      values (new.id, v_code, lower(v_code), v_name, v_avatar);
      exit;
    exception when unique_violation then
      if v_try > 25 then
        raise;
      end if;
    end;
  end loop;

  perform private.award(new.id, 'signup', 50, 'first_step',
    'explorer', 'Explorer', 'Bergabung dengan Catalyst Society');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Profil lengkap: foto, headline, tentang, dan minimal tiga keahlian.
create or replace function private.on_profile_edited()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.avatar_path, new.avatar_url) is not null
     and nullif(btrim(new.headline), '') is not null
     and nullif(btrim(new.about), '') is not null
     and cardinality(new.skills) >= 3 then
    perform private.award(new.id, 'profile_complete', 30);
  end if;
  return new;
end;
$$;
-- "update of" membatasi pemicu ke kolom isian. Pembaruan cata_points oleh
-- private.award tidak menyentuh kolom ini, jadi tidak ada putaran rekursif.
create trigger profile_edited
  after update of avatar_path, avatar_url, headline, about, skills on public.profiles
  for each row execute function private.on_profile_edited();

-- ============================================================
-- 11. STORAGE
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',      'avatars',      true,  2097152, array['image/jpeg','image/png','image/webp']),
  ('certificates', 'certificates', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('cvs',          'cvs',          false, 5242880, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Tulis: hanya ke folder bernama id pengguna itu sendiri.
create policy "unggah ke folder sendiri" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars','certificates','cvs')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "ubah berkas sendiri" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars','certificates','cvs')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id in ('avatars','certificates','cvs')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "hapus berkas sendiri" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars','certificates','cvs')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- list(), remove(), dan upsert di API storage menjalankan SELECT sebagai
-- pengguna. Tanpa kebijakan ini pemilik tidak bisa melihat baris berkasnya
-- sendiri, sehingga avatar lama dan gambar sertifikat tidak pernah terhapus,
-- termasuk saat akun dihapus. Berkasnya tetap tersaji lewat URL publik bucket.
create policy "baca berkas sendiri" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('avatars','certificates')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Baca CV: pemiliknya, atau siapa pun kalau pemilik memilih publik dan
-- profilnya publik. avatars dan certificates adalah bucket publik.
create policy "baca cv" on storage.objects
  for select
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or exists (
        select 1 from public.profiles p
        where p.id::text = (storage.foldername(name))[1]
          and p.is_public
          and p.cv_visibility = 'public'
      )
    )
  );

-- ============================================================
-- 12. DATA AWAL
-- ============================================================
insert into public.badges (code, name, description, icon) values
  ('first_step',         'First Step',         'Membuat Catalyst Passport',              'spark'),
  ('first_community',    'First Community',    'Bergabung ke komunitas pertama',         'users'),
  ('community_explorer', 'Community Explorer', 'Bergabung ke lima komunitas',            'search'),
  ('ecosystem_native',   'Ecosystem Native',   'Aktif di tiga channel industri',         'globe'),
  ('first_project',      'First Project',      'Menambahkan projek pertama',             'rocket'),
  ('certified',          'Certified',          'Memiliki sertifikat terverifikasi',      'badge'),
  ('builder',            'Builder',            'Mencapai tahap Builder pada Journey',    'cube')
on conflict (code) do nothing;

insert into public.communities (slug, name, channel) values
  ('blockplay',       'Blockplay',                       'investments'),
  ('isp',             'Investor Saham Pemula (ISP)',     'investments'),
  ('web3-enthusiast', 'Web3 Enthusiast',                 'investments'),
  ('kompaschain',     'Kompaschain',                     'investments'),
  ('crypto-legal',    'Crypto Legal Community',          'investments'),
  ('tradix',          'Tradix Community',                'investments'),
  ('aico',            'AI Community (AICO)',             'ai'),
  ('bisa-ai',         'Bisa.AI',                         'ai'),
  ('indonesia-ai',    'Indonesia AI',                    'ai'),
  ('dicoding',        'Dicoding',                        'ai'),
  ('bbka',            'Belajar Bareng Ko Andrew (BBKA)', 'business'),
  ('mekari',          'Mekari Community',                'business'),
  ('bisnis-muda',     'Bisnis Muda',                     'business'),
  ('build-club',      'Build Club',                      'builder'),
  ('python',          'Python Indonesia',                'builder'),
  ('gensmart',        'GenSmart',                        'impact'),
  ('aiesec',          'AIESEC',                          'impact'),
  ('yot',             'Young On Top (YOT)',              'impact'),
  ('yli',             'Young Leaders Indonesia (YLI)',   'impact')
on conflict (slug) do nothing;
