/* ===========================================================
   URL yang aman.

   Setiap URL yang berasal dari pengguna melewati safeHref() sebelum
   masuk ke atribut href. Database sudah menolak skema selain http(s),
   tetapi mode demo menyimpan data di localStorage yang bisa diubah
   siapa pun di perangkatnya sendiri, jadi pemeriksaan diulang di sini.
   =========================================================== */
import { SUPABASE_URL } from '@/lib/env';

/* Aturan yang sama dengan public.is_safe_url() di database. Diperiksa
   pada string hasil normalisasi, karena string itulah yang disimpan. */
const URL_AMAN = /^https?:\/\/[^\s<>"'`]+$/i;

/**
 * URL http(s) yang sah dalam bentuk normal, atau null. Menolak
 * javascript:, data:, dan apa pun yang akan ditolak CHECK database,
 * supaya formulir memberi tahu lebih dulu, bukan gagal saat disimpan.
 */
export function safeHref(u: string | null | undefined): string | null {
  if (!u) return null;
  const s = u.trim();
  if (s.length > 500) return null;
  try {
    const url = new URL(s);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const hasil = url.toString();
    return hasil.length <= 500 && URL_AMAN.test(hasil) ? hasil : null;
  } catch {
    return null;
  }
}

/**
 * Foto dari penyedia login. Hanya host foto akun Google yang diterima:
 * URL lain bisa dipakai sebagai piksel pelacak yang dimuat browser
 * setiap pengunjung profil.
 */
export function providerAvatar(u: string | null | undefined): string | null {
  const s = safeHref(u);
  return s && s.startsWith('https://lh3.googleusercontent.com/') ? s : null;
}

/**
 * Menerima isian pengguna seperti "instagram.com/nama" atau "@nama"
 * dan mengubahnya menjadi URL lengkap. Mengembalikan null bila tidak
 * bisa dijadikan URL http(s).
 */
export function normalizeLink(kind: string, raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const handle = v.replace(/^@/, '');
  const hostFor: Record<string, string> = {
    instagram: 'https://www.instagram.com/',
    twitter: 'https://x.com/',
    tiktok: 'https://www.tiktok.com/@',
    github: 'https://github.com/',
    youtube: 'https://www.youtube.com/@',
    telegram: 'https://t.me/',
    linkedin: 'https://www.linkedin.com/in/',
    facebook: 'https://www.facebook.com/',
  };
  // Nama pengguna saja: tanpa garis miring dan tanpa skema. Titik tetap
  // boleh, karena nama Instagram seperti "blockplay.id" memang memakai titik.
  if (hostFor[kind] && /^[A-Za-z0-9._-]{1,60}$/.test(handle)) {
    return hostFor[kind] + handle;
  }
  const denganSkema = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  return safeHref(denganSkema);
}

/**
 * Path relatif yang aman untuk redirect sesudah login. Menolak URL
 * absolut dan //host (open redirect ke situs lain). Garis miring
 * terbalik dan karakter kendali ditolak di mana pun letaknya, karena
 * browser membuang tab dan baris baru dari URL: "/<tab>/evil.com"
 * akan dibaca sebagai "//evil.com".
 */
export function safeNextPath(next: string | null | undefined, fallback = '/passport'): string {
  if (!next || next.length > 512) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  return next;
}

/** URL publik berkas di bucket Supabase yang bersifat publik. */
export function publicStorageUrl(bucket: 'avatars' | 'certificates', path: string | null): string | null {
  if (!path || !SUPABASE_URL) return null;
  const aman = path
    .split('/')
    .map((p) => encodeURIComponent(p))
    .join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${aman}`;
}

/** Foto profil yang ditampilkan: unggahan sendiri, lalu foto Google, lalu null. */
export function avatarSrc(p: { avatarPath: string | null; avatarUrl: string | null }): string | null {
  if (p.avatarPath) {
    // Mode demo menyimpan unggahan sebagai data URL gambar di path.
    if (p.avatarPath.startsWith('data:image/')) return p.avatarPath;
    return publicStorageUrl('avatars', p.avatarPath);
  }
  return providerAvatar(p.avatarUrl);
}

export function certificateImageSrc(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('data:image/')) return path;
  return publicStorageUrl('certificates', path);
}

/** Inisial untuk avatar cadangan. */
export function initials(name: string | null | undefined): string {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}
