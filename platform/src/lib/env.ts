/* ===========================================================
   Konfigurasi publik.

   Hanya dua nilai yang dibutuhkan, dan keduanya memang aman berada di
   browser: URL project dan kunci publik (anon / publishable). Akses
   data dijaga Row Level Security di database, bukan oleh kerahasiaan
   kunci ini. Jangan pernah menaruh service_role key di variabel yang
   diawali NEXT_PUBLIC_.

   Kalau keduanya kosong, aplikasi berjalan dalam mode demo: data
   contoh di perangkat masing masing, tanpa login sungguhan.
   =========================================================== */

// Next.js hanya menyuntikkan variabel NEXT_PUBLIC_ ke kode browser kalau
// ditulis sebagai properti statis seperti ini. process.env[nama] dinamis
// akan selalu undefined di browser.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const SUPABASE_URL = URL.replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = KEY;

/**
 * true bila kredensial Supabase terisi dan tampak sah. HTTPS wajib,
 * kecuali untuk `supabase start` di mesin sendiri (localhost / 127.0.0.1).
 */
export const isSupabaseConfigured =
  (/^https:\/\/[^\s/]+$/i.test(SUPABASE_URL) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(SUPABASE_URL)) &&
  SUPABASE_ANON_KEY.length > 20;

/** Alamat publik situs, dipakai untuk tautan berbagi dan redirect OAuth. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');

/**
 * Akun admin Catalyst. Hanya dipakai untuk mengarahkan tampilan; hak admin
 * sebenarnya diputuskan database (public.is_staff), yang juga mensyaratkan
 * email akun ini sudah terkonfirmasi.
 */
export const ADMIN_EMAIL = 'info@catalystsociety.id';
