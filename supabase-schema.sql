-- ===========================================================
-- Catalyst Society - skema database Supabase
-- Project: catalystsociety-web (ydhoxefcntwayjkslzje)
--
-- Berkas ini adalah sumber kebenaran skema. Dijalankan lewat
-- Supabase SQL Editor atau migrasi. Aman dijalankan ulang.
-- ===========================================================

-- ---------- tabel induk: profil pengguna ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  catalyst_id   text not null unique,
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  full_name     text not null check (char_length(full_name) between 1 and 80),
  headline      text check (char_length(headline) <= 140),
  location      text check (char_length(location) <= 120),
  about         text check (char_length(about) <= 2000),
  avatar_path   text,
  avatar_url    text,
  channel       text check (channel in ('investments','ai_technology','business','builders','social_impact')),
  journey_stage text not null default 'explorer'
                check (journey_stage in ('explorer','connector','builder','challenger','contributor','innovator')),
  cata_points   integer not null default 0 check (cata_points >= 0),
  is_verified   boolean not null default false,
  is_public     boolean not null default true,
  links         jsonb   not null default '{}'::jsonb,
  skills        text[]  not null default '{}'::text[] check (cardinality(skills) <= 30),
  roles         text[]  not null default '{}'::text[] check (cardinality(roles) <= 10),
  cv_file_name  text,
  cv_visibility text not null default 'private' check (cv_visibility in ('private','public')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_public_idx on public.profiles (is_public, created_at desc);
create index if not exists profiles_channel_idx on public.profiles (channel);

-- ---------- katalog lencana ----------
create table if not exists public.badges (
  code        text primary key,
  name        text not null,
  description text not null,
  icon        text not null,
  sort_order  integer not null default 0
);

create table if not exists public.user_badges (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  badge_code text not null references public.badges (code) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- ---------- riwayat journey ----------
create table if not exists public.journey_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  stage       text not null check (stage in ('explorer','connector','builder','challenger','contributor','innovator')),
  title       text not null,
  detail      text,
  occurred_at date not null default current_date,
  unique (user_id, stage)
);

-- ---------- riwayat poin ----------
create table if not exists public.point_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  delta      integer not null,
  reason     text not null,
  created_at timestamptz not null default now()
);
create index if not exists point_events_user_idx on public.point_events (user_id, created_at desc);

-- ---------- keanggotaan komunitas ----------
create table if not exists public.community_members (
  user_id        uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  community_slug text not null check (community_slug ~ '^[a-z0-9-]{2,60}$'),
  joined_at      timestamptz not null default now(),
  primary key (user_id, community_slug)
);

-- ---------- koneksi antar pengguna ----------
create table if not exists public.connections (
  follower_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists connections_following_idx on public.connections (following_id);

-- ---------- projek ----------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  description   text check (char_length(description) <= 1000),
  role          text check (char_length(role) <= 80),
  started_on    date,
  ended_on      date,
  url           text check (url is null or url ~* '^https?://'),
  collaborators integer not null default 0 check (collaborators between 0 and 10000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id, started_on desc nulls last);

-- ---------- sertifikat ----------
create table if not exists public.certificates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  source         text not null default 'self' check (source in ('self','catalyst')),
  title          text not null check (char_length(title) between 1 and 160),
  issuer         text not null check (char_length(issuer) between 1 and 120),
  issued_on      date,
  credential_id  text check (char_length(credential_id) <= 120),
  credential_url text check (credential_url is null or credential_url ~* '^https?://'),
  image_path     text,
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists certificates_user_idx on public.certificates (user_id, issued_on desc nulls last);

-- ---------- kunjungan profil (analitik) ----------
create table if not exists public.profile_views (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  viewer_key text not null,
  viewed_on  date not null default current_date,
  primary key (profile_id, viewer_key, viewed_on)
);
create index if not exists profile_views_date_idx on public.profile_views (profile_id, viewed_on);

-- ===========================================================
-- Fungsi bantu
-- ===========================================================

-- Menjaga kolom updated_at selalu mengikuti perubahan baris
create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists certificates_touch on public.certificates;
create trigger certificates_touch before update on public.certificates
  for each row execute function public.touch_updated_at();

-- Nomor Catalyst ID unik, contoh: CAT-27DA21
create or replace function public.buat_catalyst_id()
returns text language plpgsql security definer set search_path = public as $$
declare kandidat text;
begin
  loop
    kandidat := 'CAT-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where catalyst_id = kandidat);
  end loop;
  return kandidat;
end $$;

-- Alamat profil unik dari nama lengkap, contoh: bagas-dwi-putra-7f3a
create or replace function public.buat_slug(nama text, surel text)
returns text language plpgsql security definer set search_path = public as $$
declare dasar text; kandidat text; n integer := 0;
begin
  dasar := lower(coalesce(nullif(trim(nama), ''), split_part(coalesce(surel, 'catalyst'), '@', 1)));
  dasar := regexp_replace(dasar, '[^a-z0-9]+', '-', 'g');
  dasar := trim(both '-' from dasar);
  if char_length(dasar) < 3 then dasar := 'catalyst-' || dasar; end if;
  dasar := left(dasar, 32);
  dasar := trim(both '-' from dasar);
  kandidat := dasar;
  loop
    exit when not exists (select 1 from public.profiles where slug = kandidat);
    n := n + 1;
    kandidat := left(dasar, 32) || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
    if n > 20 then kandidat := 'catalyst-' || substr(md5(gen_random_uuid()::text), 1, 10); end if;
  end loop;
  return kandidat;
end $$;

-- Menambah poin sekaligus mencatat alasannya
create or replace function public.tambah_poin(p_user uuid, p_delta integer, p_alasan text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.point_events (user_id, delta, reason) values (p_user, p_delta, p_alasan);
  update public.profiles set cata_points = greatest(0, cata_points + p_delta) where id = p_user;
end $$;

-- Memberi lencana sekali saja per pengguna
create or replace function public.beri_lencana(p_user uuid, p_kode text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_badges (user_id, badge_code) values (p_user, p_kode)
  on conflict do nothing;
end $$;

-- Mencatat tahap journey sekali saja per tahap
create or replace function public.catat_journey(p_user uuid, p_stage text, p_judul text, p_detail text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.journey_events (user_id, stage, title, detail)
  values (p_user, p_stage, p_judul, p_detail)
  on conflict (user_id, stage) do nothing;
end $$;

-- ===========================================================
-- Akun baru: membuat profil, journey pertama, lencana, dan poin
-- ===========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nama    text;
  v_channel text;
  v_avatar  text;
begin
  v_nama := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, 'Catalyst Member'), '@', 1)
  );
  v_channel := nullif(new.raw_user_meta_data ->> 'channel', '');
  if v_channel is not null and v_channel not in
     ('investments','ai_technology','business','builders','social_impact') then
    v_channel := null;
  end if;
  v_avatar := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  insert into public.profiles (id, catalyst_id, slug, full_name, channel, avatar_url)
  values (new.id, public.buat_catalyst_id(), public.buat_slug(v_nama, new.email),
          left(v_nama, 80), v_channel, v_avatar)
  on conflict (id) do nothing;

  perform public.catat_journey(new.id, 'explorer', 'Explorer', 'Bergabung dengan Catalyst Society');
  perform public.beri_lencana(new.id, 'first_step');
  perform public.tambah_poin(new.id, 50, 'Membuat Catalyst Passport');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profil ikut diperbarui saat pengguna mengganti nama atau foto di penyedia login
create or replace function public.handle_user_updated()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p set
    avatar_url = coalesce(nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
                          nullif(new.raw_user_meta_data ->> 'picture', ''), p.avatar_url)
  where p.id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated after update of raw_user_meta_data on auth.users
  for each row execute function public.handle_user_updated();

-- ===========================================================
-- Gamifikasi: poin, lencana, dan kenaikan tahap journey
-- ===========================================================

-- Tahap journey dihitung ulang dari aktivitas nyata pengguna
create or replace function public.hitung_journey(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  n_komunitas integer;
  n_projek    integer;
  n_sertifikat integer;
  n_koneksi   integer;
  tahap       text := 'explorer';
begin
  select count(*) into n_komunitas  from public.community_members where user_id = p_user;
  select count(*) into n_projek     from public.projects          where user_id = p_user;
  select count(*) into n_sertifikat from public.certificates      where user_id = p_user;
  select count(*) into n_koneksi    from public.connections       where follower_id = p_user;
  if n_komunitas >= 3  then tahap := 'connector';   end if;
  if n_projek    >= 1  then tahap := 'builder';     end if;
  if n_sertifikat >= 1 then tahap := 'challenger';  end if;
  if n_koneksi   >= 5  then tahap := 'contributor'; end if;
  if n_projek >= 3 and n_sertifikat >= 3 then tahap := 'innovator'; end if;

  -- lencana yang bergantung jumlah
  if n_komunitas >= 1 then perform public.beri_lencana(p_user, 'first_community');    end if;
  if n_komunitas >= 5 then perform public.beri_lencana(p_user, 'community_explorer'); end if;
  if n_komunitas >= 8 then perform public.beri_lencana(p_user, 'ecosystem_native');   end if;
  if n_projek    >= 1 then perform public.beri_lencana(p_user, 'first_project');      end if;
  if n_sertifikat >= 1 then perform public.beri_lencana(p_user, 'certified');         end if;
  if tahap in ('builder','challenger','contributor','innovator')
                      then perform public.beri_lencana(p_user, 'builder');            end if;

  -- catatan journey untuk tahap yang sudah tercapai
  if n_komunitas >= 3  then perform public.catat_journey(p_user, 'connector',   'Connector',   'Bergabung ke tiga komunitas'); end if;
  if n_projek    >= 1  then perform public.catat_journey(p_user, 'builder',     'Builder',     'Membuat projek pertama');      end if;
  if n_sertifikat >= 1 then perform public.catat_journey(p_user, 'challenger',  'Challenger',  'Menambahkan sertifikat');      end if;
  if n_koneksi   >= 5  then perform public.catat_journey(p_user, 'contributor', 'Contributor', 'Terhubung dengan lima builder'); end if;
  if tahap = 'innovator' then perform public.catat_journey(p_user, 'innovator', 'Innovator',  'Dampak dan skala');             end if;

  update public.profiles set journey_stage = tahap where id = p_user and journey_stage is distinct from tahap;
end $$;

create or replace function public.setelah_gabung_komunitas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.tambah_poin(new.user_id, 10, 'Bergabung ke komunitas ' || new.community_slug);
  perform public.hitung_journey(new.user_id);
  return new;
end $$;

create or replace function public.setelah_projek()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.tambah_poin(new.user_id, 40, 'Menambahkan projek: ' || new.title);
  perform public.hitung_journey(new.user_id);
  return new;
end $$;

create or replace function public.setelah_sertifikat()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.tambah_poin(new.user_id, 30, 'Menambahkan sertifikat: ' || new.title);
  perform public.hitung_journey(new.user_id);
  return new;
end $$;

create or replace function public.setelah_koneksi()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.tambah_poin(new.follower_id, 5, 'Terhubung dengan builder baru');
  perform public.hitung_journey(new.follower_id);
  return new;
end $$;

-- Tabel projects, certificates, dan community_members hanya punya user_id.
-- Perhitungan dilewati bila profilnya sendiri sudah terhapus berantai.
create or replace function public.setelah_hapus_baris()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = old.user_id) then
    perform public.hitung_journey(old.user_id);
  end if;
  return old;
end $$;

create or replace function public.setelah_batal_koneksi()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = old.follower_id) then
    perform public.hitung_journey(old.follower_id);
  end if;
  return old;
end $$;

drop trigger if exists community_members_after_insert on public.community_members;
create trigger community_members_after_insert after insert on public.community_members
  for each row execute function public.setelah_gabung_komunitas();

drop trigger if exists projects_after_insert on public.projects;
create trigger projects_after_insert after insert on public.projects
  for each row execute function public.setelah_projek();

drop trigger if exists certificates_after_insert on public.certificates;
create trigger certificates_after_insert after insert on public.certificates
  for each row execute function public.setelah_sertifikat();

drop trigger if exists connections_after_insert on public.connections;
create trigger connections_after_insert after insert on public.connections
  for each row execute function public.setelah_koneksi();

drop trigger if exists community_members_after_delete on public.community_members;
create trigger community_members_after_delete after delete on public.community_members
  for each row execute function public.setelah_hapus_baris();

drop trigger if exists projects_after_delete on public.projects;
create trigger projects_after_delete after delete on public.projects
  for each row execute function public.setelah_hapus_baris();

drop trigger if exists certificates_after_delete on public.certificates;
create trigger certificates_after_delete after delete on public.certificates
  for each row execute function public.setelah_hapus_baris();

drop trigger if exists connections_after_delete on public.connections;
create trigger connections_after_delete after delete on public.connections
  for each row execute function public.setelah_batal_koneksi();

-- ===========================================================
-- RPC yang dipanggil aplikasi
-- ===========================================================

-- Mencatat satu kunjungan profil publik per pengunjung per hari
create or replace function public.record_profile_view(p_slug text)
returns void language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_key text;
begin
  select id into v_profile from public.profiles
   where slug = lower(p_slug) and is_public = true;
  if v_profile is null then return; end if;
  if auth.uid() = v_profile then return; end if;

  -- pengunjung yang masuk dihitung per akun, tamu dihitung per alamat IP harian
  v_key := coalesce(
    auth.uid()::text,
    'anon-' || md5(coalesce(
      (current_setting('request.headers', true)::json ->> 'x-forwarded-for'), 'tanpa-ip'
    ) || current_date::text)
  );

  insert into public.profile_views (profile_id, viewer_key)
  values (v_profile, left(v_key, 80))
  on conflict do nothing;
end $$;

-- Menghapus akun sendiri beserta seluruh datanya
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Tidak ada sesi aktif.'; end if;
  delete from auth.users where id = v_user;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.record_profile_view(text) to anon, authenticated;

-- ===========================================================
-- Row Level Security
-- Aturan dasar: data publik boleh dibaca siapa saja, tetapi hanya
-- pemiliknya yang boleh menulis.
-- ===========================================================
alter table public.profiles          enable row level security;
alter table public.badges            enable row level security;
alter table public.user_badges       enable row level security;
alter table public.journey_events    enable row level security;
alter table public.point_events      enable row level security;
alter table public.community_members enable row level security;
alter table public.connections       enable row level security;
alter table public.projects          enable row level security;
alter table public.certificates      enable row level security;
alter table public.profile_views     enable row level security;

-- Benar bila profil itu publik, atau milik pengguna yang sedang masuk
create or replace function public.boleh_lihat_profil(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = p_user and (is_public = true or id = auth.uid())
  )
$$;

-- profiles
drop policy if exists profiles_baca on public.profiles;
create policy profiles_baca on public.profiles for select
  using (is_public = true or id = auth.uid());

drop policy if exists profiles_ubah on public.profiles;
create policy profiles_ubah on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_tambah on public.profiles;
create policy profiles_tambah on public.profiles for insert
  with check (id = auth.uid());

-- badges: katalog terbuka
drop policy if exists badges_baca on public.badges;
create policy badges_baca on public.badges for select using (true);

-- user_badges
drop policy if exists user_badges_baca on public.user_badges;
create policy user_badges_baca on public.user_badges for select
  using (public.boleh_lihat_profil(user_id));

-- journey_events
drop policy if exists journey_baca on public.journey_events;
create policy journey_baca on public.journey_events for select
  using (public.boleh_lihat_profil(user_id));

-- point_events: hanya pemilik
drop policy if exists point_baca on public.point_events;
create policy point_baca on public.point_events for select
  using (user_id = auth.uid());

-- community_members
drop policy if exists komunitas_baca on public.community_members;
create policy komunitas_baca on public.community_members for select
  using (public.boleh_lihat_profil(user_id));

drop policy if exists komunitas_gabung on public.community_members;
create policy komunitas_gabung on public.community_members for insert
  with check (user_id = auth.uid());

drop policy if exists komunitas_keluar on public.community_members;
create policy komunitas_keluar on public.community_members for delete
  using (user_id = auth.uid());

-- connections: jumlah pengikut terlihat publik
drop policy if exists koneksi_baca on public.connections;
create policy koneksi_baca on public.connections for select using (true);

drop policy if exists koneksi_ikuti on public.connections;
create policy koneksi_ikuti on public.connections for insert
  with check (follower_id = auth.uid());

drop policy if exists koneksi_berhenti on public.connections;
create policy koneksi_berhenti on public.connections for delete
  using (follower_id = auth.uid());

-- projects
drop policy if exists projek_baca on public.projects;
create policy projek_baca on public.projects for select
  using (public.boleh_lihat_profil(user_id));

drop policy if exists projek_tambah on public.projects;
create policy projek_tambah on public.projects for insert
  with check (user_id = auth.uid());

drop policy if exists projek_ubah on public.projects;
create policy projek_ubah on public.projects for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists projek_hapus on public.projects;
create policy projek_hapus on public.projects for delete
  using (user_id = auth.uid());

-- certificates
drop policy if exists sertifikat_baca on public.certificates;
create policy sertifikat_baca on public.certificates for select
  using (public.boleh_lihat_profil(user_id));

drop policy if exists sertifikat_tambah on public.certificates;
create policy sertifikat_tambah on public.certificates for insert
  with check (user_id = auth.uid() and source = 'self' and is_verified = false);

drop policy if exists sertifikat_ubah on public.certificates;
create policy sertifikat_ubah on public.certificates for update
  using (user_id = auth.uid() and source = 'self')
  with check (user_id = auth.uid() and source = 'self' and is_verified = false);

drop policy if exists sertifikat_hapus on public.certificates;
create policy sertifikat_hapus on public.certificates for delete
  using (user_id = auth.uid() and source = 'self');

-- profile_views: hanya pemilik profil yang melihat analitiknya
drop policy if exists kunjungan_baca on public.profile_views;
create policy kunjungan_baca on public.profile_views for select
  using (profile_id = auth.uid());

-- ===========================================================
-- Isi awal katalog lencana
-- ===========================================================
insert into public.badges (code, name, description, icon, sort_order) values
  ('first_step',         'First Step',         'Membuat Catalyst Passport',          'spark',  1),
  ('first_community',    'First Community',    'Bergabung ke komunitas pertama',     'users',  2),
  ('community_explorer', 'Community Explorer', 'Bergabung ke lima komunitas',        'search', 3),
  ('ecosystem_native',   'Ecosystem Native',   'Aktif di delapan komunitas',         'globe',  4),
  ('first_project',      'First Project',      'Menambahkan projek pertama',         'rocket', 5),
  ('certified',          'Certified',          'Memiliki sertifikat terverifikasi',  'badge',  6),
  ('builder',            'Builder',            'Mencapai tahap Builder pada Journey','cube',   7)
on conflict (code) do update
  set name = excluded.name, description = excluded.description,
      icon = excluded.icon, sort_order = excluded.sort_order;

-- ===========================================================
-- Storage: foto profil, gambar sertifikat, dan CV
-- avatars dan certificates dibaca publik lewat URL,
-- cvs tertutup dan hanya dibuka lewat signed URL.
-- Berkas selalu disimpan di folder bernama id pengguna.
-- ===========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',      'avatars',      true,  2097152, array['image/jpeg','image/png','image/webp']),
  ('certificates', 'certificates', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('cvs',          'cvs',          false, 5242880, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_publik_baca on storage.objects;
create policy storage_publik_baca on storage.objects for select
  using (bucket_id in ('avatars','certificates'));

drop policy if exists storage_cv_baca on storage.objects;
create policy storage_cv_baca on storage.objects for select
  to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists storage_unggah on storage.objects;
create policy storage_unggah on storage.objects for insert
  to authenticated
  with check (bucket_id in ('avatars','certificates','cvs')
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists storage_ganti on storage.objects;
create policy storage_ganti on storage.objects for update
  to authenticated
  using (bucket_id in ('avatars','certificates','cvs')
         and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('avatars','certificates','cvs')
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists storage_hapus on storage.objects;
create policy storage_hapus on storage.objects for delete
  to authenticated
  using (bucket_id in ('avatars','certificates','cvs')
         and (storage.foldername(name))[1] = auth.uid()::text);


-- ===========================================================
-- Hak akses fungsi
-- Fungsi bantu hanya dipakai trigger. Tanpa pencabutan ini, siapa pun
-- bisa memanggilnya lewat /rest/v1/rpc dan menaikkan poin atau memberi
-- lencana kepada akun mana pun.
-- ===========================================================
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('beri_lencana','buat_catalyst_id','buat_slug','catat_journey',
                         'handle_new_user','handle_user_updated','hitung_journey','tambah_poin',
                         'setelah_gabung_komunitas','setelah_projek','setelah_sertifikat',
                         'setelah_koneksi','setelah_hapus_baris','setelah_batal_koneksi',
                         'touch_updated_at',
                         'boleh_lihat_profil')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- boleh_lihat_profil dievaluasi di dalam kebijakan RLS oleh peran pemanggil,
-- jadi peran itu wajib boleh menjalankannya. Isinya hanya menjawab apakah
-- sebuah profil publik, sehingga aman.
grant execute on function public.boleh_lihat_profil(uuid) to anon, authenticated;

revoke all on function public.record_profile_view(text) from public;
grant execute on function public.record_profile_view(text) to anon, authenticated;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
