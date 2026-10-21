/* ===========================================================
   Pemeriksaan isian yang sama dengan CHECK di 0001_init.sql, supaya
   pengguna diberi tahu sebelum menyimpan, bukan sesudah ditolak.
   =========================================================== */
import { safeHref } from '@/lib/url';

/** Teks kosong disimpan sebagai null, bukan string kosong. */
export function orNull(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

/**
 * Tautan dalam bentuk normal yang juga dipakai saat pemeriksaan, supaya
 * yang disimpan persis string yang sudah lolos urlError().
 */
export function urlOrNull(v: string): string | null {
  const t = v.trim();
  return t ? safeHref(t) : null;
}

export function lengthError(v: string, max: number, label: string, required = false): string | null {
  const t = v.trim();
  if (required && !t) return `${label} wajib diisi.`;
  if (t.length > max) return `${label} maksimal ${max} karakter.`;
  return null;
}

/** is_safe_url di SQL: kosong, atau http(s) tanpa spasi, maksimal 500 karakter. */
export function urlError(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  if (t.length > 500) return 'Tautan maksimal 500 karakter.';
  if (/\s/.test(t) || !/^https?:\/\//i.test(t)) return 'Tautan harus diawali https:// atau http://.';
  if (!safeHref(t)) return 'Tautan tidak valid atau terlalu panjang, dan tidak boleh memuat tanda kutip atau < >.';
  return null;
}

export function isDay(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function dayError(v: string, label: string): string | null {
  if (!v) return null;
  return isDay(v) ? null : `${label} tidak valid.`;
}

export type Errors<K extends string> = Partial<Record<K, string>>;

export function hasErrors<K extends string>(e: Errors<K>): boolean {
  return Object.values(e).some(Boolean);
}
