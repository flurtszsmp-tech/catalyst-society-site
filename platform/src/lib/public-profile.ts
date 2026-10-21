import 'server-only';

import { cache } from 'react';
import { DEMO_SLUG, buildDemoSeed } from '@/lib/data/demo-seed';
import { isSupabaseConfigured } from '@/lib/env';
import { getServerSupabase } from '@/lib/supabase/server';
import type { EarnedBadge, PassportBundle } from '@/lib/types';
import { PROFILE_COLS, toCertificate, toJourney, toProfile, toProject, type Row } from '@/lib/repo/mappers';

/**
 * Seluruh isi Passport untuk slug tertentu, dibaca di server.
 *
 * RLS yang memutuskan apa yang terlihat: profil privat hanya kembali
 * bila yang meminta adalah pemiliknya. Hasil null berarti "tidak ada
 * atau tidak boleh dilihat"; halaman memperlakukan keduanya sama
 * supaya keberadaan profil privat tidak bocor.
 *
 * Dibungkus cache() karena generateMetadata dan halaman memanggilnya
 * dalam render yang sama.
 */
export const getPublicBundle = cache(async (slug: string): Promise<PassportBundle | null> => {
  const s = slug.toLowerCase();

  if (!isSupabaseConfigured) {
    if (s !== DEMO_SLUG) return null;
    const d = buildDemoSeed();
    return {
      profile: d.profile,
      journey: d.journey,
      badges: d.badges,
      communities: d.communities,
      projects: d.projects,
      certificates: d.certificates,
      followers: d.followers.length,
      following: d.following.length,
    };
  }

  const db = await getServerSupabase();
  if (!db) return null;

  const { data: row } = await db.from('profiles').select(PROFILE_COLS).eq('slug', s).maybeSingle();
  if (!row) return null;
  const profile = toProfile(row);
  const id = profile.id;

  const [journey, badges, coms, projects, certs, followers, following] = await Promise.all([
    db.from('journey_events').select('stage, title, detail, occurred_at').eq('user_id', id).order('occurred_at'),
    db.from('user_badges').select('earned_at, badges(code, name, description, icon)').eq('user_id', id).order('earned_at'),
    db.from('community_members').select('community_slug').eq('user_id', id),
    db.from('projects').select('*').eq('user_id', id).order('started_on', { ascending: false, nullsFirst: false }),
    db.from('certificates').select('*').eq('user_id', id).order('issued_on', { ascending: false, nullsFirst: false }),
    db.from('connections').select('*', { count: 'exact', head: true }).eq('following_id', id),
    db.from('connections').select('*', { count: 'exact', head: true }).eq('follower_id', id),
  ]);

  const earned: EarnedBadge[] = (badges.data ?? []).flatMap((r: Row) => {
    const b = r.badges as Row | null;
    return b
      ? [{ code: b.code as string, name: b.name as string, description: (b.description as string) ?? null, icon: b.icon as string, earnedAt: r.earned_at as string }]
      : [];
  });

  return {
    profile,
    journey: (journey.data ?? []).map(toJourney),
    badges: earned,
    communities: (coms.data ?? []).map((r: Row) => r.community_slug as string),
    projects: (projects.data ?? []).map(toProject),
    certificates: (certs.data ?? []).map(toCertificate),
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
});
