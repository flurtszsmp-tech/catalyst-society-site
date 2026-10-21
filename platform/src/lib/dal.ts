import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/env';
import { getServerSupabase } from '@/lib/supabase/server';
import type { SessionUser } from '@/lib/types';

/**
 * Data Access Layer. Satu-satunya tempat server memutuskan siapa yang
 * sedang masuk. Dibungkus React cache() sehingga dipanggil berkali kali
 * dalam satu render hanya memeriksa sekali.
 *
 * getUser() bertanya langsung ke server Auth Supabase, jadi token yang
 * sudah dicabut atau dipalsukan ditolak. proxy.ts hanya memeriksa
 * secara optimistis; jangan jadikan proxy satu-satunya penjaga.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) {
    return { id: 'demo', email: 'demo@catalystsociety.id', provider: 'demo' };
  }
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    provider: (data.user.app_metadata?.provider as string | undefined) ?? 'email',
  };
});

/** Untuk halaman yang wajib masuk. Mengarahkan tamu ke /login. */
export async function requireUser(nextPath = '/passport'): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
