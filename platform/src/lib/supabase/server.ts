import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env';

/**
 * Klien Supabase untuk Server Component, Server Action, dan Route
 * Handler. Wajib dibuat baru per permintaan; jangan disimpan di modul.
 *
 * Server Component tidak boleh menulis cookie, jadi setAll di sana
 * akan melempar. Itu ditelan dengan sengaja: pembaruan token sudah
 * ditangani proxy.ts pada setiap permintaan, dan Server Action serta
 * Route Handler tetap bisa menulis cookie seperti biasa.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  const toples = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return toples.getAll();
      },
      setAll(daftar) {
        try {
          for (const { name, value, options } of daftar) {
            toples.set(name, value, options);
          }
        } catch {
          // Dipanggil dari Server Component. Lihat catatan di atas.
        }
      },
    },
  });
}
