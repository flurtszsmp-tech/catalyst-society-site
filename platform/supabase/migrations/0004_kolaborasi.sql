-- ============================================================
-- 0004 Permintaan kolaborasi dari landing (catalystsociety.id/#kolaborasi)
--
-- Pengunjung, masuk atau tidak, mengirim lewat public.submit_collaboration().
-- Tabelnya sendiri tertutup: tidak ada insert langsung, dan hanya admin
-- (public.is_staff) yang bisa membaca dan mengubah status.
-- ============================================================

create sequence if not exists private.collab_no_seq;

create table if not exists public.collaboration_requests (
  id           uuid primary key default gen_random_uuid(),
  ref_no       text not null unique,
  user_id      uuid references auth.users on delete set null,
  full_name    text not null check (char_length(full_name) between 2 and 120),
  job_title    text check (char_length(job_title) <= 120),
  email        text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone        text check (char_length(phone) <= 40),
  organization text check (char_length(organization) <= 160),
  org_type     text check (char_length(org_type) <= 60),
  website      text check (char_length(website) <= 300),
  kinds        text[] not null check (cardinality(kinds) between 1 and 12),
  industries   text[] not null default '{}' check (cardinality(industries) <= 6),
  budget       text check (char_length(budget) <= 60),
  timeline     text check (char_length(timeline) <= 60),
  contact_pref text check (char_length(contact_pref) <= 40),
  source       text check (char_length(source) <= 80),
  message      text not null check (char_length(message) between 10 and 4000),
  status       text not null default 'baru' check (status in ('baru','ditinjau','dihubungi','berjalan','selesai','ditolak')),
  admin_note   text check (char_length(admin_note) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists collaboration_requests_created_idx on public.collaboration_requests (created_at desc);
create index if not exists collaboration_requests_email_idx on public.collaboration_requests (lower(email), created_at desc);

alter table public.collaboration_requests enable row level security;
revoke all on table public.collaboration_requests from anon, authenticated;
grant select on table public.collaboration_requests to authenticated;
grant update (status, admin_note) on table public.collaboration_requests to authenticated;

drop policy if exists "admin membaca kolaborasi" on public.collaboration_requests;
create policy "admin membaca kolaborasi" on public.collaboration_requests
  for select to authenticated using (public.is_staff());
drop policy if exists "admin menindaklanjuti kolaborasi" on public.collaboration_requests;
create policy "admin menindaklanjuti kolaborasi" on public.collaboration_requests
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function private.touch_collaboration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists collaboration_touch on public.collaboration_requests;
create trigger collaboration_touch before update on public.collaboration_requests
  for each row execute function private.touch_collaboration();

-- Teks bebas dari formulir: dipangkas, kosong menjadi null.
create or replace function private.teks(v jsonb, k text, maks integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(left(btrim(coalesce(v ->> k, '')), maks), '');
$$;

-- Daftar pilihan dari formulir: hanya string, dipangkas, tanpa duplikat.
create or replace function private.daftar(v jsonb, k text, maks integer)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(distinct left(btrim(x), 60)) filter (where btrim(x) <> ''), '{}')
    from (
      select x from jsonb_array_elements_text(
        case when jsonb_typeof(v -> k) = 'array' then v -> k else '[]'::jsonb end
      ) as t(x)
      limit maks
    ) s;
$$;

-- Satu-satunya pintu masuk. Mengembalikan nomor referensi untuk pengirim.
-- Batas: tiga kiriman per email per 10 menit, supaya formulir tidak dibanjiri.
create or replace function public.submit_collaboration(p jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(private.teks(p, 'email', 200));
  v_ref   text;
begin
  if jsonb_typeof(p) is distinct from 'object' then
    raise exception 'Data formulir tidak valid.' using errcode = '22023';
  end if;
  -- Kolom jebakan bot: manusia tidak pernah mengisinya.
  if private.teks(p, 'situs_web', 10) is not null then
    raise exception 'Kiriman ditolak.' using errcode = '22023';
  end if;
  if (select count(*) from public.collaboration_requests
       where lower(email) = v_email and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Terlalu banyak kiriman. Coba lagi beberapa menit lagi.' using errcode = 'P0001';
  end if;

  v_ref := 'KOL-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMM') || '-' || lpad(nextval('private.collab_no_seq')::text, 4, '0');

  insert into public.collaboration_requests (
    ref_no, user_id, full_name, job_title, email, phone, organization, org_type, website,
    kinds, industries, budget, timeline, contact_pref, source, message
  ) values (
    v_ref, auth.uid(),
    private.teks(p, 'full_name', 120), private.teks(p, 'job_title', 120), v_email,
    private.teks(p, 'phone', 40), private.teks(p, 'organization', 160), private.teks(p, 'org_type', 60),
    private.teks(p, 'website', 300),
    private.daftar(p, 'kinds', 12), private.daftar(p, 'industries', 6),
    private.teks(p, 'budget', 60), private.teks(p, 'timeline', 60), private.teks(p, 'contact_pref', 40),
    private.teks(p, 'source', 80), private.teks(p, 'message', 4000)
  );
  return v_ref;
end;
$$;

revoke all on function public.submit_collaboration(jsonb) from public;
grant execute on function public.submit_collaboration(jsonb) to anon, authenticated;
revoke all on function private.teks(jsonb, text, integer) from public;
revoke all on function private.daftar(jsonb, text, integer) from public;
