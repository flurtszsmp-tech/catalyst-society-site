import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env';

/**
 * Memperbarui token Supabase pada setiap permintaan dan mengembalikan
 * respons yang membawa cookie terbaru, beserta id pengguna bila ada.
 *
 * Ini pemeriksaan optimistis, bukan penjaga data. Keamanan sesungguhnya
 * ada di RLS database dan di src/lib/dal.ts.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; userId: string | null }> {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return { response, userId: null };

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(daftar, header) {
        for (const { name, value } of daftar) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of daftar) response.cookies.set(name, value, options);
        // Respons yang menulis cookie sesi tidak boleh di-cache CDN.
        // Tanpa ini, token satu pengguna bisa tersaji ke pengguna lain.
        for (const [k, v] of Object.entries(header ?? {})) response.headers.set(k, v);
      },
    },
  });

  // Jangan sisipkan kode lain di antara pembuatan klien dan getClaims():
  // di sinilah token kedaluwarsa diperbarui dan cookie ditulis ulang.
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;

  return { response, userId };
}
