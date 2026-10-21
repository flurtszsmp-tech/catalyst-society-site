-- ============================================================
-- Catalyst Society — dashboard admin dan penyederhanaan verifikasi
--
-- Jalankan sesudah 0002_journey_v2.sql.
--
--   1. Admin tunggal: akun info@catalystsociety.id. Hak admin diberikan
--      otomatis saat akun itu terdaftar, dan hanya berlaku selama emailnya
--      sudah terkonfirmasi. Akun admin tidak punya Passport publik.
--   2. Komunitas bebas: bergabung tidak perlu diperiksa dan tidak memberi
--      poin CATA. Tetap dihitung untuk syarat tahap Connector.
--   3. Sertifikat terverifikasi otomatis bila ID kredensial atau tautan
--      bukti disertakan. Tanpa keduanya tetap tampil, bertanda belum
--      terverifikasi. Sertifikat tidak lagi memberi poin CATA.
--   4. CV bisa berupa tautan (misalnya Google Drive), tersimpan di tabel
--      terpisah supaya tautan CV privat tidak ikut terbaca orang lain.
--   5. Admin membaca seluruh data aktivitas (kecuali kata sandi dan
--      rahasia akun) dan menerima masukan pengguna lewat tabel feedback.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Admin
-- ------------------------------------------------------------
create or replace function private.admin_email()
returns text
language sql
immutable
set search_path = ''
as $$
  select 'info@catalystsociety.id'::text;
$$;

-- Hak admin butuh dua hal: terdaftar di private.staff dan email akunnya
-- sudah terkonfirmasi. Tanpa syarat kedua, siapa pun yang lebih dulu
-- mendaftar dengan alamat itu saat konfirmasi email mati akan jadi admin.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from private.staff s
      join auth.users u on u.id = s.user_id
     where s.user_id = (select auth.uid())
       and u.email_confirmed_at is not null
  );
$$;

-- Hanya admin resmi yang tersisa di tim.
delete from private.staff s
 using auth.users u
 where u.id = s.user_id and lower(u.email) <> private.admin_email();
delete from private.staff s where not exists (select 1 from auth.users u where u.id = s.user_id);
insert into private.staff (user_id)
select id from auth.users where lower(email) = private.admin_email()
on conflict do nothing;

-- Pemeriksa boleh melihat semua profil turunan, termasuk yang privat.
create or replace function public.profile_visible(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_staff() or exists (
    select 1 from public.profiles p
    where p.id = uid and (p.is_public or p.id = (select auth.uid()))
  );
$$;

-- ------------------------------------------------------------
-- 2. Pengguna baru
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
  -- Akun admin bukan anggota: tanpa Passport, tanpa Catalyst ID.
  if lower(coalesce(new.email, '')) = private.admin_email() then
    insert into private.staff (user_id) values (new.id) on conflict do nothing;
    return new;
  end if;

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
-- 3. Komunitas bebas
-- ------------------------------------------------------------
alter table public.community_members alter column status set default 'verified';
update public.community_members set status = 'verified', review_note = null, reviewed_at = null where status <> 'verified';

drop policy if exists "keanggotaan mengikuti profil" on public.community_members;
create policy "keanggotaan mengikuti profil" on public.community_members
  for select using (public.profile_visible(user_id) or user_id = (select auth.uid()));
drop policy if exists "pemilik melengkapi bukti" on public.community_members;
revoke update on table public.community_members from authenticated;
drop trigger if exists membership_proof on public.community_members;
drop function if exists private.on_membership_proof();
drop function if exists public.staff_review_membership(uuid, text, boolean, text);

-- ------------------------------------------------------------
-- 4. Sertifikat terverifikasi otomatis
-- ------------------------------------------------------------
create or replace function private.on_certificate_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Sertifikat terbitan Catalyst selalu terverifikasi dan tidak disentuh.
  if new.source = 'self' then
    new.is_verified := nullif(btrim(coalesce(new.credential_id, '')), '') is not null
                    or nullif(btrim(coalesce(new.credential_url, '')), '') is not null;
    new.review_note := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists certificate_edited on public.certificates;
drop function if exists private.on_certificate_edited();
drop trigger if exists certificate_verify on public.certificates;
create trigger certificate_verify before insert or update on public.certificates
  for each row execute function private.on_certificate_write();

-- Kebijakan dinilai sesudah pemicu BEFORE, jadi syarat "belum terverifikasi"
-- dibuang: tanda verifikasi kini ditentukan pemicu, bukan pengguna.
drop policy if exists "pemilik menambah sertifikat" on public.certificates;
create policy "pemilik menambah sertifikat" on public.certificates
  for insert to authenticated
  with check (user_id = (select auth.uid()) and source = 'self');
drop policy if exists "pemilik mengubah sertifikat sendiri" on public.certificates;
create policy "pemilik mengubah sertifikat sendiri" on public.certificates
  for update to authenticated
  using (user_id = (select auth.uid()) and source = 'self')
  with check (user_id = (select auth.uid()) and source = 'self');

drop function if exists public.staff_review_certificate(uuid, boolean, text);

-- Sertifikat lama ditandai ulang mengikuti aturan baru.
update public.certificates set title = title where source = 'self';

-- ------------------------------------------------------------
-- 5. Poin: komunitas dan sertifikat tidak lagi memberi poin
-- ------------------------------------------------------------
with buang as (
  delete from public.point_events
   where reason like 'community:%' or reason like 'cert:%'
  returning user_id, delta
)
update public.profiles p
   set cata_points = greatest(0, p.cata_points - b.jumlah)
  from (select user_id, sum(delta) as jumlah from buang group by user_id) b
 where b.user_id = p.id;

-- ------------------------------------------------------------
-- 6. Perhitungan tahap: komunitas dihitung tanpa pemeriksaan
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
  v_certok integer;
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

  select count(*) into v_kom from public.community_members where user_id = p_user;
  select count(distinct c.channel) into v_kanal
    from public.community_members m join public.communities c on c.slug = m.community_slug
   where m.user_id = p_user;
  select count(*) into v_ikut from public.connections where follower_id = p_user;
  select count(*), count(*) filter (where is_verified) into v_cert, v_certok
    from public.certificates where user_id = p_user;
  select count(*) into v_proj from public.projects where user_id = p_user;
  select coalesce(array_agg(kind), '{}') into v_klaim
    from public.journey_claims where user_id = p_user and status = 'approved';

  if v_kom >= 1 then perform private.give_badge(p_user, 'first_community'); end if;
  if v_kom >= 5 then perform private.give_badge(p_user, 'community_explorer'); end if;
  if v_kanal >= 3 then perform private.give_badge(p_user, 'ecosystem_native'); end if;
  if v_certok >= 1 then perform private.give_badge(p_user, 'certified'); end if;
  if v_proj >= 1 then
    perform private.give_badge(p_user, 'first_project');
    perform private.give_points(p_user, 'first_project', 15);
  end if;

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
revoke all on function private.recompute_journey(uuid) from public, anon, authenticated;

-- Bergabung dan keluar komunitas kini langsung menghitung ulang tahap.
create or replace function private.on_membership_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.recompute_journey(new.user_id);
  return new;
end;
$$;
drop trigger if exists membership_added on public.community_members;
create trigger membership_added after insert on public.community_members
  for each row execute function private.on_membership_changed();

create or replace function private.on_certificate_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.certificates where user_id = new.user_id) > 100 then
    raise exception 'Batas 100 sertifikat per profil tercapai' using errcode = 'check_violation';
  end if;
  perform private.recompute_journey(new.user_id);
  return new;
end;
$$;
-- Bukti yang ditambahkan belakangan juga memberi lencana Certified.
drop trigger if exists certificate_updated on public.certificates;
create trigger certificate_updated after update of credential_id, credential_url on public.certificates
  for each row execute function private.on_certificate_added();

-- Semua pengguna dihitung ulang dengan aturan komunitas yang baru.
do $$
declare r record;
begin
  for r in select id from public.profiles loop
    perform private.recompute_journey(r.id);
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- 7. Tautan CV
-- ------------------------------------------------------------
create table if not exists public.cv_links (
  user_id    uuid primary key default auth.uid() references public.profiles on delete cascade,
  url        text not null check (public.is_safe_url(url) and url like 'https://%'),
  updated_at timestamptz not null default now()
);
alter table public.cv_links enable row level security;
drop policy if exists "tautan cv terbaca" on public.cv_links;
create policy "tautan cv terbaca" on public.cv_links
  for select using (
    user_id = (select auth.uid())
    or public.is_staff()
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public and p.cv_visibility = 'public')
  );
drop policy if exists "pemilik menyimpan tautan cv" on public.cv_links;
create policy "pemilik menyimpan tautan cv" on public.cv_links
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "pemilik mengganti tautan cv" on public.cv_links;
create policy "pemilik mengganti tautan cv" on public.cv_links
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "pemilik menghapus tautan cv" on public.cv_links;
create policy "pemilik menghapus tautan cv" on public.cv_links
  for delete to authenticated using (user_id = (select auth.uid()));
revoke all on table public.cv_links from anon, authenticated;
grant select on table public.cv_links to anon, authenticated;
grant insert (url), update (url, updated_at), delete on table public.cv_links to authenticated;

-- ------------------------------------------------------------
-- 8. Masukan pengguna
-- ------------------------------------------------------------
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  user_id    uuid default auth.uid() references public.profiles on delete set null,
  kind       text not null default 'saran' check (kind in ('saran','masalah','pertanyaan','lainnya')),
  message    text not null check (char_length(message) between 5 and 2000),
  page       text check (char_length(page) <= 200),
  status     text not null default 'baru' check (status in ('baru','dibaca','selesai')),
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);
alter table public.feedback enable row level security;
drop policy if exists "pengguna mengirim masukan" on public.feedback;
create policy "pengguna mengirim masukan" on public.feedback
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'baru');
drop policy if exists "masukan terbaca pengirim dan admin" on public.feedback;
create policy "masukan terbaca pengirim dan admin" on public.feedback
  for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
drop policy if exists "admin menandai masukan" on public.feedback;
create policy "admin menandai masukan" on public.feedback
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
revoke all on table public.feedback from anon, authenticated;
grant select on table public.feedback to authenticated;
grant insert (kind, message, page), update (status) on table public.feedback to authenticated;

-- ------------------------------------------------------------
-- 9. Akses baca admin
-- ------------------------------------------------------------
drop policy if exists "riwayat poin milik sendiri" on public.point_events;
create policy "riwayat poin milik sendiri" on public.point_events
  for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists "kunjungan milik sendiri" on public.profile_views;
create policy "kunjungan milik sendiri" on public.profile_views
  for select to authenticated using (profile_id = (select auth.uid()) or public.is_staff());

-- Data akun untuk admin: hanya kolom yang aman. Kata sandi, token, dan
-- metadata rahasia lain tidak pernah keluar dari auth.users.
create or replace function public.admin_users()
returns table (
  id uuid,
  email text,
  provider text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_staff();
  return query
    select u.id, u.email::text, coalesce(u.raw_app_meta_data->>'provider', 'email'),
           u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null
      from auth.users u
     where lower(coalesce(u.email, '')) <> private.admin_email()
     order by u.created_at desc;
end;
$$;

-- Satu linimasa aktivitas seluruh pengguna, terbaru lebih dulu.
create or replace function public.admin_activity(p_limit integer default 200)
returns table (kind text, user_id uuid, detail text, at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_staff();
  return query
  select * from (
    select 'daftar'::text, p.id, 'Membuat Catalyst Passport ' || p.catalyst_id, p.created_at from public.profiles p
    union all
    select 'journey', j.user_id, 'Mencapai tahap ' || j.title, j.occurred_at from public.journey_events j where j.stage <> 'explorer'
    union all
    select 'poin', e.user_id, e.reason || ' (' || case when e.delta >= 0 then '+' else '' end || e.delta || ')', e.created_at from public.point_events e
    union all
    select 'projek', x.user_id, 'Menambah projek ' || x.title, x.created_at from public.projects x
    union all
    select 'sertifikat', c.user_id, 'Menambah sertifikat ' || c.title || case when c.is_verified then ' (terverifikasi)' else '' end, c.created_at from public.certificates c
    union all
    select 'komunitas', m.user_id, 'Bergabung ke ' || coalesce(k.name, m.community_slug), m.joined_at
      from public.community_members m left join public.communities k on k.slug = m.community_slug
    union all
    select 'koneksi', n.follower_id, 'Mengikuti ' || coalesce(f.full_name, 'anggota'), n.created_at
      from public.connections n left join public.profiles f on f.id = n.following_id
    union all
    select 'pengajuan', q.user_id, 'Mengajukan verifikasi ' || q.kind || ' (' || q.status || ')', q.created_at from public.journey_claims q
    union all
    select 'feedback', b.user_id, 'Mengirim masukan: ' || left(b.message, 80), b.created_at from public.feedback b
  ) t
  order by 4 desc
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
end;
$$;

revoke all on function public.admin_users() from public, anon;
revoke all on function public.admin_activity(integer) from public, anon;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.admin_activity(integer) to authenticated;
