-- ============================================================
-- Catalyst Society — Journey v2, verifikasi, dan Catalyst ID berurutan
--
-- Jalankan sesudah 0001_init.sql. Aman dijalankan sekali pada database
-- yang sudah berisi pengguna: data lama ditata ulang mengikuti aturan baru.
--
-- Yang berubah:
--
--   1. Catalyst ID berurutan: CP-00001, CP-00002, dan seterusnya, menurut
--      urutan pendaftaran. Alamat profil yang masih bawaan (sama dengan
--      Catalyst ID lama) ikut diganti; alamat yang sudah disetel sendiri
--      tidak disentuh.
--
--   2. Journey tujuh tahap, berurutan:
--        explorer    bergabung
--        connector   5 komunitas terverifikasi dan mengikuti 5 orang
--        challenger  punya sertifikat dan 1 sesi bootcamp terverifikasi
--        innovator   punya projek atau komunitas yang pernah dibangun
--        contributor membantu projek di Catalyst Finder (diverifikasi tim)
--        builder     membangun projek di Catalyst Labs (diverifikasi tim)
--        founder     bisnis bervaluasi di atas Rp100 juta (diverifikasi tim)
--      Tahap hanya naik. Poin CATA tidak memengaruhi tahap.
--
--   3. Bergabung ke komunitas berstatus menunggu sampai tim memeriksa bukti
--      keanggotaan. Hanya keanggotaan terverifikasi yang tampil di profil
--      publik, dihitung untuk Connector, dan memberi poin.
--
--   4. Poin CATA lebih sulit didapat dan tidak bisa dipancing: tidak ada
--      poin untuk mengikuti orang atau sekadar menekan Gabung. Setiap
--      alasan tetap hanya dihadiahkan sekali.
--
--   5. Tim Catalyst (tabel private.staff) memeriksa keanggotaan komunitas,
--      sertifikat, dan klaim tahap lewat fungsi staff_review_* yang
--      memeriksa sendiri apakah pemanggilnya anggota tim.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Tim Catalyst
-- ------------------------------------------------------------
create table if not exists private.staff (
  user_id  uuid primary key references auth.users on delete cascade,
  added_at timestamptz not null default now()
);

-- Menjawab apakah pengguna yang sedang masuk anggota tim. Hanya
-- membocorkan status diri sendiri, jadi aman dipanggil dari browser.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.staff s where s.user_id = (select auth.uid()));
$$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to anon, authenticated;

-- Profil privat tetap terbaca tim, supaya nama pemohon tampil di antrean.
drop policy if exists "profil publik atau milik sendiri" on public.profiles;
create policy "profil publik atau milik sendiri" on public.profiles
  for select using (is_public or id = (select auth.uid()) or public.is_staff());

-- ------------------------------------------------------------
-- 1. Catalyst ID berurutan
-- ------------------------------------------------------------
create sequence if not exists private.catalyst_no_seq;

create or replace function private.format_catalyst_id(n bigint)
returns text
language sql
immutable
set search_path = ''
as $$
  -- lpad memotong angka yang lebih panjang dari 5 digit, jadi nomor ke-100.000
  -- dan seterusnya ditulis utuh.
  select 'CP-' || case when n < 100000 then lpad(n::text, 5, '0') else n::text end;
$$;

-- Nomor ulang pengguna lama menurut urutan daftar. Catalyst ID lama
-- berawalan CAT-, jadi tidak bisa bertabrakan dengan nomor baru.
with urut as (
  select id, catalyst_id as lama, row_number() over (order by created_at, id) as n
  from public.profiles
)
update public.profiles p
   set catalyst_id = private.format_catalyst_id(u.n),
       slug = case when p.slug = lower(u.lama) then lower(private.format_catalyst_id(u.n)) else p.slug end
  from urut u
 where u.id = p.id;

select setval('private.catalyst_no_seq',
              greatest((select count(*) from public.profiles), 1),
              (select count(*) > 0 from public.profiles));

-- ------------------------------------------------------------
-- 2. Tahap Journey
-- ------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_journey_stage_check;
alter table public.profiles add constraint profiles_journey_stage_check
  check (journey_stage in ('explorer','connector','challenger','innovator','contributor','builder','founder'));

alter table public.journey_events drop constraint if exists journey_events_stage_check;
alter table public.journey_events add constraint journey_events_stage_check
  check (stage in ('explorer','connector','challenger','innovator','contributor','builder','founder'));

-- Tahap terakhir yang sudah dirayakan di layar pemiliknya. Pop up ucapan
-- muncul selama journey_stage berada di depan kolom ini.
alter table public.profiles add column if not exists journey_seen_stage text not null default 'explorer';
alter table public.profiles drop constraint if exists profiles_journey_seen_stage_check;
alter table public.profiles add constraint profiles_journey_seen_stage_check
  check (journey_seen_stage in ('explorer','connector','challenger','innovator','contributor','builder','founder'));
grant update (journey_seen_stage) on table public.profiles to authenticated;

create or replace function private.stage_rank(s text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_position(
    array['explorer','connector','challenger','innovator','contributor','builder','founder'], s), 1);
$$;

-- ------------------------------------------------------------
-- 3. Verifikasi keanggotaan komunitas
-- ------------------------------------------------------------
alter table public.community_members
  add column if not exists status      text not null default 'pending',
  add column if not exists proof       text,
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz;

alter table public.community_members drop constraint if exists community_members_status_check;
alter table public.community_members add constraint community_members_status_check
  check (status in ('pending','verified','rejected'));
alter table public.community_members drop constraint if exists community_members_proof_check;
alter table public.community_members add constraint community_members_proof_check
  check (proof is null or char_length(proof) <= 300);

-- Keanggotaan lama tidak pernah diperiksa, jadi ikut antre verifikasi.
update public.community_members set status = 'pending' where status <> 'pending';

-- Pengunjung hanya melihat keanggotaan terverifikasi. Pemilik melihat
-- statusnya sendiri; tim melihat semuanya untuk antrean.
drop policy if exists "keanggotaan mengikuti profil" on public.community_members;
create policy "keanggotaan mengikuti profil" on public.community_members
  for select using (
    (public.profile_visible(user_id) and status = 'verified')
    or user_id = (select auth.uid())
    or public.is_staff()
  );

revoke insert on table public.community_members from authenticated;
grant insert (community_slug, proof), delete on table public.community_members to authenticated;
-- Bukti boleh dilengkapi selama belum diterima. Status tidak pernah
-- diberikan ke pengguna: hanya staff_review_membership yang mengubahnya.
grant update (proof) on table public.community_members to authenticated;
drop policy if exists "pemilik melengkapi bukti" on public.community_members;
create policy "pemilik melengkapi bukti" on public.community_members
  for update to authenticated
  using (user_id = (select auth.uid()) and status <> 'verified')
  with check (user_id = (select auth.uid()));

-- Bukti yang diubah sesudah ditolak kembali masuk antrean.
create or replace function private.on_membership_proof()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.proof is distinct from old.proof and old.status = 'rejected' then
    new.status := 'pending';
    new.review_note := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists membership_proof on public.community_members;
create trigger membership_proof before update of proof on public.community_members
  for each row execute function private.on_membership_proof();

-- ------------------------------------------------------------
-- 4. Pemeriksaan sertifikat
-- ------------------------------------------------------------
alter table public.certificates
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz;

drop policy if exists "sertifikat mengikuti profil" on public.certificates;
create policy "sertifikat mengikuti profil" on public.certificates
  for select using (public.profile_visible(user_id) or public.is_staff());

-- Sertifikat yang sudah diverifikasi terkunci: mengubah judul atau
-- penerbitnya sesudah diperiksa akan membuat tanda terverifikasi berbohong.
drop policy if exists "pemilik mengubah sertifikat sendiri" on public.certificates;
create policy "pemilik mengubah sertifikat sendiri" on public.certificates
  for update to authenticated
  using (user_id = (select auth.uid()) and source = 'self' and not is_verified)
  with check (user_id = (select auth.uid()) and source = 'self' and not is_verified);

create or replace function private.on_certificate_edited()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Sertifikat yang ditolak lalu diperbaiki pemiliknya kembali ke antrean.
  -- Pembaruan oleh fungsi pemeriksaan tim mengubah is_verified atau
  -- reviewed_at sendiri, jadi tidak tersentuh aturan ini.
  if not new.is_verified
     and new.reviewed_at is not distinct from old.reviewed_at
     and (new.title, new.issuer, new.issued_on, new.credential_id, new.credential_url, new.image_path)
         is distinct from (old.title, old.issuer, old.issued_on, old.credential_id, old.credential_url, old.image_path) then
    new.reviewed_at := null;
    new.review_note := null;
  end if;
  return new;
end;
$$;
drop trigger if exists certificate_edited on public.certificates;
create trigger certificate_edited before update on public.certificates
  for each row execute function private.on_certificate_edited();

-- ------------------------------------------------------------
-- 5. Klaim tahap yang diverifikasi tim
-- ------------------------------------------------------------
create table if not exists public.journey_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles on delete cascade,
  kind        text not null check (kind in ('bootcamp','finder','labs','founder')),
  detail      text not null check (char_length(detail) between 10 and 800),
  url         text check (public.is_safe_url(url)),
  -- Valuasi bisnis dalam rupiah, wajib untuk klaim Founder.
  valuation   bigint check (valuation is null or valuation > 0),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  check (kind <> 'founder' or valuation > 100000000)
);
create index if not exists journey_claims_user_idx on public.journey_claims (user_id);
-- Satu klaim aktif per jenis; klaim yang ditolak boleh diajukan ulang.
create unique index if not exists journey_claims_one_active
  on public.journey_claims (user_id, kind) where status in ('pending','approved');

alter table public.journey_claims enable row level security;
drop policy if exists "klaim milik sendiri" on public.journey_claims;
create policy "klaim milik sendiri" on public.journey_claims
  for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
drop policy if exists "pemilik mengajukan klaim" on public.journey_claims;
create policy "pemilik mengajukan klaim" on public.journey_claims
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending');
drop policy if exists "pemilik membatalkan klaim" on public.journey_claims;
create policy "pemilik membatalkan klaim" on public.journey_claims
  for delete to authenticated using (user_id = (select auth.uid()) and status = 'pending');
revoke all on table public.journey_claims from anon, authenticated;
grant select on table public.journey_claims to authenticated;
grant insert (kind, detail, url, valuation), delete on table public.journey_claims to authenticated;

-- ------------------------------------------------------------
-- 6. Poin dan lencana
--    Dua pintu terpisah dari tahap journey. Tiap alasan hanya sekali.
-- ------------------------------------------------------------
create or replace function private.give_points(p_user uuid, p_reason text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  insert into public.point_events (user_id, delta, reason)
  values (p_user, p_delta, p_reason)
  on conflict (user_id, reason) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update public.profiles set cata_points = cata_points + p_delta where id = p_user;
  end if;
end;
$$;

create or replace function private.give_badge(p_user uuid, p_badge text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_badges (user_id, badge_code) values (p_user, p_badge) on conflict do nothing;
$$;

insert into public.badges (code, name, description, icon) values
  ('founder', 'Founder', 'Pemilik bisnis yang diverifikasi tim Catalyst', 'crown')
on conflict (code) do update set name = excluded.name, description = excluded.description, icon = excluded.icon;
update public.badges set description = 'Lima komunitas terverifikasi' where code = 'community_explorer';
update public.badges set description = 'Komunitas terverifikasi di tiga channel industri' where code = 'ecosystem_native';
update public.badges set description = 'Komunitas pertama yang terverifikasi' where code = 'first_community';

-- ------------------------------------------------------------
-- 7. Perhitungan tahap
-- ------------------------------------------------------------
create or replace function private.recompute_journey(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kom    integer;
  v_kanal  integer;
  v_ikut   integer;
  v_cert   integer;
  v_proj   integer;
  v_klaim  text[];
  v_target text := 'explorer';
  v_kini   text;
  v_order  text[] := array['explorer','connector','challenger','innovator','contributor','builder','founder'];
  v_judul  text[] := array['Explorer','Connector','Challenger','Innovator','Contributor','Builder','Founder'];
  v_detail text[] := array[
    'Bergabung dengan Catalyst Society',
    'Lima komunitas dan lima koneksi',
    'Sertifikat dan sesi bootcamp',
    'Membangun projek atau komunitas',
    'Membantu projek di Catalyst Finder',
    'Membangun projek di Catalyst Labs',
    'Bisnis bervaluasi di atas Rp100 juta'];
  v_poin   integer[] := array[0, 25, 50, 75, 100, 150, 300];
  i        integer;
begin
  select journey_stage into v_kini from public.profiles where id = p_user;
  if v_kini is null then
    return;
  end if;

  select count(*) into v_kom from public.community_members where user_id = p_user and status = 'verified';
  select count(distinct c.channel) into v_kanal
    from public.community_members m join public.communities c on c.slug = m.community_slug
   where m.user_id = p_user and m.status = 'verified';
  select count(*) into v_ikut from public.connections where follower_id = p_user;
  select count(*) into v_cert from public.certificates where user_id = p_user;
  select count(*) into v_proj from public.projects where user_id = p_user;
  select coalesce(array_agg(kind), '{}') into v_klaim
    from public.journey_claims where user_id = p_user and status = 'approved';

  -- Lencana yang tidak bergantung urutan tahap.
  if v_kom >= 1 then perform private.give_badge(p_user, 'first_community'); end if;
  if v_kom >= 5 then perform private.give_badge(p_user, 'community_explorer'); end if;
  if v_kanal >= 3 then perform private.give_badge(p_user, 'ecosystem_native'); end if;
  if v_proj >= 1 then
    perform private.give_badge(p_user, 'first_project');
    perform private.give_points(p_user, 'first_project', 15);
  end if;

  -- Tahap berurutan: tiap tahap mensyaratkan tahap sebelumnya.
  if v_kom >= 5 and v_ikut >= 5 then
    v_target := 'connector';
    if v_cert >= 1 and 'bootcamp' = any(v_klaim) then
      v_target := 'challenger';
      if v_proj >= 1 then
        v_target := 'innovator';
        if 'finder' = any(v_klaim) then
          v_target := 'contributor';
          if 'labs' = any(v_klaim) then
            v_target := 'builder';
            if 'founder' = any(v_klaim) then
              v_target := 'founder';
            end if;
          end if;
        end if;
      end if;
    end if;
  end if;

  -- Hanya naik. Setiap tahap yang dilewati ikut dicatat, dan tiap tahap
  -- memberi hadiahnya sekali.
  if private.stage_rank(v_target) > private.stage_rank(v_kini) then
    for i in (private.stage_rank(v_kini) + 1) .. private.stage_rank(v_target) loop
      insert into public.journey_events (user_id, stage, title, detail)
      values (p_user, v_order[i], v_judul[i], v_detail[i])
      on conflict (user_id, stage) do nothing;
      perform private.give_points(p_user, 'stage:' || v_order[i], v_poin[i]);
    end loop;
    update public.profiles set journey_stage = v_target where id = p_user;
  end if;

  if greatest(private.stage_rank(v_kini), private.stage_rank(v_target)) >= private.stage_rank('builder') then
    perform private.give_badge(p_user, 'builder');
  end if;
  if v_target = 'founder' or v_kini = 'founder' then
    perform private.give_badge(p_user, 'founder');
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 8. Pemicu: aktivitas pengguna menghitung ulang tahap
--    Bergabung ke komunitas tidak lagi memberi apa pun sampai
--    keanggotaannya diterima tim.
-- ------------------------------------------------------------
drop trigger if exists community_joined on public.community_members;
drop function if exists private.on_community_joined();

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
  perform private.recompute_journey(new.user_id);
  return new;
end;
$$;

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
  perform private.recompute_journey(new.user_id);
  return new;
end;
$$;

create or replace function private.on_connection_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.recompute_journey(new.follower_id);
  return new;
end;
$$;
drop trigger if exists connection_added on public.connections;
create trigger connection_added after insert on public.connections
  for each row execute function private.on_connection_added();

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
    perform private.give_points(new.id, 'profile_complete', 20);
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 9. Pengguna baru: Catalyst ID berurutan
-- ------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code    text;
  v_slug    text;
  v_name    text;
  v_avatar  text;
  v_channel text;
begin
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

  v_channel := nullif(btrim(new.raw_user_meta_data->>'channel'), '');
  if v_channel not in ('investments','ai','business','builder','impact') then
    v_channel := null;
  end if;

  -- Nomor dari sequence tidak pernah dipakai dua kali, jadi Catalyst ID
  -- tidak bisa bertabrakan. Alamat profil bisa bertabrakan dengan alamat
  -- yang disetel sendiri orang lain; bila begitu, diberi akhiran acak.
  v_code := private.format_catalyst_id(nextval('private.catalyst_no_seq'));
  v_slug := lower(v_code);
  if exists (select 1 from public.profiles where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  insert into public.profiles (id, catalyst_id, slug, full_name, avatar_url, channel)
  values (new.id, v_code, v_slug, v_name, v_avatar, v_channel);

  insert into public.journey_events (user_id, stage, title, detail)
  values (new.id, 'explorer', 'Explorer', 'Bergabung dengan Catalyst Society');
  perform private.give_points(new.id, 'signup', 10);
  perform private.give_badge(new.id, 'first_step');

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 10. Pemeriksaan oleh tim Catalyst
--     Dipanggil dari halaman Verifikasi di Passport. Setiap fungsi
--     memeriksa sendiri apakah pemanggilnya anggota tim.
-- ------------------------------------------------------------
create or replace function private.require_staff()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Hanya tim Catalyst yang boleh memeriksa.' using errcode = 'insufficient_privilege';
  end if;
end;
$$;

create or replace function public.staff_review_membership(
  p_user uuid, p_slug text, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dapat integer;
begin
  perform private.require_staff();
  update public.community_members
     set status = case when p_approve then 'verified' else 'rejected' end,
         review_note = nullif(btrim(coalesce(p_note, '')), ''),
         reviewed_at = now()
   where user_id = p_user and community_slug = p_slug;
  if not found then
    raise exception 'Keanggotaan tidak ditemukan.' using errcode = 'no_data_found';
  end if;
  if p_approve then
    -- Lima poin per komunitas terverifikasi, paling banyak sepuluh komunitas.
    select count(*) into v_dapat from public.point_events where user_id = p_user and reason like 'community:%';
    if v_dapat < 10 then
      perform private.give_points(p_user, 'community:' || p_slug, 5);
    end if;
  end if;
  perform private.recompute_journey(p_user);
end;
$$;

create or replace function public.staff_review_certificate(
  p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid;
  v_dapat integer;
begin
  perform private.require_staff();
  update public.certificates
     set is_verified = p_approve,
         review_note = nullif(btrim(coalesce(p_note, '')), ''),
         reviewed_at = now()
   where id = p_id
  returning user_id into v_user;
  if v_user is null then
    raise exception 'Sertifikat tidak ditemukan.' using errcode = 'no_data_found';
  end if;
  if p_approve then
    select count(*) into v_dapat from public.point_events where user_id = v_user and reason like 'cert:%';
    if v_dapat < 10 then
      perform private.give_points(v_user, 'cert:' || p_id::text, 25);
    end if;
    perform private.give_badge(v_user, 'certified');
  end if;
  perform private.recompute_journey(v_user);
end;
$$;

create or replace function public.staff_review_claim(
  p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  perform private.require_staff();
  update public.journey_claims
     set status = case when p_approve then 'approved' else 'rejected' end,
         review_note = nullif(btrim(coalesce(p_note, '')), ''),
         reviewed_at = now()
   where id = p_id and status = 'pending'
  returning user_id into v_user;
  if v_user is null then
    raise exception 'Klaim tidak ditemukan atau sudah diperiksa.' using errcode = 'no_data_found';
  end if;
  perform private.recompute_journey(v_user);
end;
$$;

revoke all on function public.staff_review_membership(uuid, text, boolean, text) from public, anon;
revoke all on function public.staff_review_certificate(uuid, boolean, text) from public, anon;
revoke all on function public.staff_review_claim(uuid, boolean, text) from public, anon;
grant execute on function public.staff_review_membership(uuid, text, boolean, text) to authenticated;
grant execute on function public.staff_review_certificate(uuid, boolean, text) to authenticated;
grant execute on function public.staff_review_claim(uuid, boolean, text) to authenticated;

-- Fungsi bantu tidak pernah terekspos ke API.
revoke all on function private.give_points(uuid, text, integer) from public, anon, authenticated;
revoke all on function private.give_badge(uuid, text) from public, anon, authenticated;
revoke all on function private.recompute_journey(uuid) from public, anon, authenticated;
revoke all on function private.require_staff() from public, anon, authenticated;

drop function if exists private.award(uuid, text, integer, text, text, text, text);

-- ------------------------------------------------------------
-- 11. Data lama mengikuti aturan baru
--     Poin, lencana, dan journey dihitung ulang dari nol. Keanggotaan
--     komunitas sudah dipindah ke antrean verifikasi di bagian 3.
-- ------------------------------------------------------------
-- Cadangan keadaan sebelum penataan ulang, supaya bisa dikembalikan bila perlu.
create table if not exists private.backup_v1_point_events as select * from public.point_events;
create table if not exists private.backup_v1_user_badges as select * from public.user_badges;
create table if not exists private.backup_v1_journey_events as select * from public.journey_events;
create table if not exists private.backup_v1_profiles as
  select id, cata_points, journey_stage from public.profiles;

delete from public.point_events;
delete from public.user_badges;
delete from public.journey_events;
update public.profiles set cata_points = 0, journey_stage = 'explorer', journey_seen_stage = 'explorer';

insert into public.journey_events (user_id, stage, title, detail, occurred_at)
select id, 'explorer', 'Explorer', 'Bergabung dengan Catalyst Society', created_at from public.profiles;

do $$
declare
  r record;
begin
  for r in select * from public.profiles loop
    perform private.give_points(r.id, 'signup', 10);
    perform private.give_badge(r.id, 'first_step');
    if coalesce(r.avatar_path, r.avatar_url) is not null
       and nullif(btrim(r.headline), '') is not null
       and nullif(btrim(r.about), '') is not null
       and cardinality(r.skills) >= 3 then
      perform private.give_points(r.id, 'profile_complete', 20);
    end if;
    perform private.recompute_journey(r.id);
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- 12. Anggota tim pertama: pemilik Catalyst Society.
--     Anggota lain ditambahkan dari SQL Editor dengan:
--       insert into private.staff (user_id)
--       select id from auth.users where email = 'nama@catalystsociety.id';
-- ------------------------------------------------------------
insert into private.staff (user_id)
select id from auth.users where email = 'dbagasputra27@gmail.com'
on conflict do nothing;
