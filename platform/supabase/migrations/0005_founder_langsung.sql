-- ============================================================
-- 0005 Founder yang disetujui tim langsung menjadi tahap Founder.
--
-- Sebelumnya tahap dihitung berurutan: Founder hanya tercapai bila syarat
-- Connector sampai Builder sudah lengkap, jadi klaim Founder yang disetujui
-- admin tidak mengubah tahap anggota yang masih Explorer. Founder adalah
-- akses eksklusif untuk pemilik bisnis bervaluasi di atas Rp100 juta yang
-- diverifikasi langsung oleh tim, sehingga persetujuannya sendiri cukup.
--
-- Tahap di antaranya tidak ditandai tercapai dan poinnya tidak diberikan:
-- hanya tahap yang syaratnya benar terpenuhi yang tercatat, ditambah Founder.
-- ============================================================

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
  v_capai  text := 'explorer';   -- tahap dari syarat berurutan
  v_target text;                 -- tahap akhir, termasuk Founder yang disetujui tim
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
    v_capai := 'connector';
    if v_cert >= 1 and 'bootcamp' = any(v_klaim) then
      v_capai := 'challenger';
      if v_proj >= 1 then
        v_capai := 'innovator';
        if 'finder' = any(v_klaim) then
          v_capai := 'contributor';
          if 'labs' = any(v_klaim) then
            v_capai := 'builder';
            if 'founder' = any(v_klaim) then
              v_capai := 'founder';
            end if;
          end if;
        end if;
      end if;
    end if;
  end if;

  v_target := case when 'founder' = any(v_klaim) then 'founder' else v_capai end;

  if private.stage_rank(v_target) > private.stage_rank(v_kini) then
    -- Tahap yang syaratnya terpenuhi berurutan: catat dan beri poin.
    for i in (private.stage_rank(v_kini) + 1) .. private.stage_rank(v_capai) loop
      insert into public.journey_events (user_id, stage, title, detail)
      values (p_user, v_order[i], v_judul[i], v_detail[i])
      on conflict (user_id, stage) do nothing;
      perform private.give_points(p_user, 'stage:' || v_order[i], v_poin[i]);
    end loop;
    -- Founder lewat verifikasi tim, melompati tahap yang belum terpenuhi.
    if v_target = 'founder' and v_capai <> 'founder' then
      insert into public.journey_events (user_id, stage, title, detail)
      values (p_user, 'founder', 'Founder', v_detail[7])
      on conflict (user_id, stage) do nothing;
      perform private.give_points(p_user, 'stage:founder', v_poin[7]);
    end if;
    update public.profiles set journey_stage = v_target where id = p_user;
  end if;

  if greatest(private.stage_rank(v_kini), private.stage_rank(v_capai)) >= private.stage_rank('builder') then
    perform private.give_badge(p_user, 'builder');
  end if;
  if v_target = 'founder' or v_kini = 'founder' then
    perform private.give_badge(p_user, 'founder');
  end if;
end;
$$;

-- Anggota yang klaim Founder-nya sudah disetujui sebelum perubahan ini.
do $$
declare r record;
begin
  for r in select distinct user_id from public.journey_claims where kind = 'founder' and status = 'approved' loop
    perform private.recompute_journey(r.user_id);
  end loop;
end;
$$;
