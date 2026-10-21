-- ============================================================
-- Tiruan bagian Supabase yang dipakai 0001_init.sql, untuk PGlite.
--
-- Dijalankan sebagai superuser PGlite sebelum migrasi. Yang ditiru
-- hanya yang memengaruhi hasil migrasi dan RLS: peran, hak bawaan,
-- auth.users beserta auth.uid()/auth.jwt(), dan tabel storage.
-- Isi fungsi auth.* dan storage.foldername disalin dari definisi
-- Supabase supaya kebijakan RLS dievaluasi dengan cara yang sama.
-- ============================================================

-- Peran API. PostgREST dan API storage berpindah ke peran ini dengan
-- SET ROLE sesuai klaim "role" di JWT.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

-- Pemilik schema auth dan storage, seperti di Supabase. GoTrue menulis
-- auth.users sebagai supabase_auth_admin, jadi trigger pendaftaran
-- dipicu oleh peran ini.
create role supabase_auth_admin nologin noinherit createrole;
create role supabase_storage_admin nologin noinherit createrole;

-- Pengganti peran postgres di SQL Editor Supabase: bukan superuser,
-- punya BYPASSRLS. Migrasi dijalankan sebagai peran ini supaya fungsi
-- security definer tidak diam-diam memakai hak superuser PGlite.
create role sql_editor nologin createrole bypassrls;

do $$
begin
  execute format('grant create on database %I to sql_editor', current_database());
end;
$$;

-- ------------------------------------------------------------
-- schema public: hak bawaan Supabase
-- ------------------------------------------------------------
grant usage, create on schema public to sql_editor;
grant usage on schema public to anon, authenticated, service_role;

-- Supabase memberi ALL ke anon dan authenticated untuk setiap objek baru
-- di public. Karena itu revoke di migrasi benar-benar berarti.
alter default privileges for role sql_editor in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role sql_editor in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges for role sql_editor in schema public
  grant all on functions to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- schema auth
-- ------------------------------------------------------------
create schema auth authorization supabase_auth_admin;

create table auth.users (
  id                 uuid primary key,
  email              text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data  jsonb not null default '{}'::jsonb,
  email_confirmed_at timestamptz,
  last_sign_in_at    timestamptz,
  created_at         timestamptz not null default now()
);
alter table auth.users owner to supabase_auth_admin;
alter table auth.users enable row level security;

create function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create function auth.role() returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

create function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

alter function auth.uid() owner to supabase_auth_admin;
alter function auth.role() owner to supabase_auth_admin;
alter function auth.jwt() owner to supabase_auth_admin;

grant usage on schema auth to anon, authenticated, service_role, sql_editor;
grant all on auth.users to sql_editor, service_role;

-- ------------------------------------------------------------
-- schema storage
-- ------------------------------------------------------------
create schema storage authorization supabase_storage_admin;

create table storage.buckets (
  id                 text primary key,
  name               text not null,
  owner              uuid,
  public             boolean default false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create unique index bname on storage.buckets (name);

create table storage.objects (
  id               uuid primary key default gen_random_uuid(),
  bucket_id        text references storage.buckets (id),
  name             text,
  owner            uuid,
  metadata         jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  last_accessed_at timestamptz default now()
);
create unique index bucketid_objname on storage.objects (bucket_id, name);

alter table storage.buckets owner to supabase_storage_admin;
alter table storage.objects owner to supabase_storage_admin;
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

create function storage.foldername(name text) returns text[]
language plpgsql
as $$
declare
  _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end;
$$;

create function storage.filename(name text) returns text
language plpgsql
as $$
declare
  _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[array_length(_parts, 1)];
end;
$$;

alter function storage.foldername(text) owner to supabase_storage_admin;
alter function storage.filename(text) owner to supabase_storage_admin;

grant usage on schema storage to anon, authenticated, service_role, sql_editor;
grant all on storage.buckets, storage.objects to anon, authenticated, service_role;

-- Di Supabase, postgres boleh membuat kebijakan di storage.objects dan
-- mengisi storage.buckets. Membuat kebijakan butuh hak pemilik, jadi
-- sql_editor dijadikan anggota pemiliknya.
grant supabase_storage_admin to sql_editor;
grant all on storage.buckets, storage.objects to sql_editor;
