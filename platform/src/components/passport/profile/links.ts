import type { LinkKey } from '@/lib/types';
import { normalizeLink, safeHref } from '@/lib/url';

interface LinkMeta {
  label: string;
  icon: string;
  placeholder: string;
  /** Kanal yang menerima nama pengguna saja, sesuai hostFor di normalizeLink. */
  handle: boolean;
}

export const LINK_META: Record<LinkKey, LinkMeta> = {
  linkedin: { label: 'LinkedIn', icon: 'linkedin', placeholder: 'linkedin.com/in/nama-anda', handle: true },
  instagram: { label: 'Instagram', icon: 'instagram', placeholder: '@nama_anda', handle: true },
  twitter: { label: 'Twitter / X', icon: 'x', placeholder: '@nama_anda', handle: true },
  youtube: { label: 'YouTube', icon: 'youtube', placeholder: '@kanal_anda', handle: true },
  tiktok: { label: 'TikTok', icon: 'tiktok', placeholder: '@nama_anda', handle: true },
  github: { label: 'GitHub', icon: 'gh', placeholder: 'nama-pengguna', handle: true },
  website: { label: 'Website', icon: 'globe', placeholder: 'situsanda.com', handle: false },
  portfolio: { label: 'Portfolio', icon: 'briefcase', placeholder: 'behance.net/nama-anda', handle: false },
  facebook: { label: 'Facebook', icon: 'fb', placeholder: 'facebook.com/nama.anda', handle: true },
  telegram: { label: 'Telegram', icon: 'tg', placeholder: '@nama_anda', handle: true },
};

/**
 * URL akhir untuk satu kanal: '' bila dikosongkan, null bila tidak bisa
 * dijadikan tautan yang aman.
 */
export function resolveLink(kind: LinkKey, raw: string): string | null {
  const v = raw.trim();
  if (!v) return '';
  const aman = safeHref(normalizeLink(kind, v));
  if (!aman) return null;
  // "https://nama" lolos pengurai URL, tetapi tanpa titik di host itu
  // hampir pasti nama pengguna yang diketik di kolom Website.
  if (!new URL(aman).hostname.includes('.')) return null;
  return aman;
}

export function linkError(kind: LinkKey): string {
  const m = LINK_META[kind];
  return m.handle
    ? `Tautan ${m.label} tidak valid. Isi nama pengguna (mis. @nama) atau alamat lengkap https://…`
    : `Tautan ${m.label} tidak valid. Isi alamat situs, mis. situsanda.com.`;
}

/** Bentuk pembanding, supaya "@nama" dan URL lengkapnya dianggap sama. */
export function canonicalLink(kind: LinkKey, raw: string): string {
  return resolveLink(kind, raw) ?? raw.trim();
}

/** Tautan internal ke profil publik. Slug tetap di-encode karena data mode demo bisa diubah di localStorage. */
export function publicPath(slug: string): string {
  return `/p/?u=${encodeURIComponent(slug)}`;
}
