/* Aturan tampil direktori yang dipakai server dan klien. Tanpa hook,
   supaya halaman server bisa memakainya untuk metadata dan 404. */
import { CHANNELS, type ChannelKey, type Community } from '@/lib/data/communities';
import { safeHref } from '@/lib/url';

export type ChannelFilter = ChannelKey | 'all';

/** Nilai ?ch= yang tidak dikenal diabaikan, sama seperti situs lama. */
export function parseChannel(v: string | string[] | null | undefined): ChannelFilter {
  const s = Array.isArray(v) ? v[0] : v;
  return CHANNELS.some((c) => c.key === s) ? (s as ChannelKey) : 'all';
}

/**
 * Logo komunitas, atau null untuk ubin inisial. safeHref() hanya
 * menerima URL absolut, sedangkan logo mitra adalah path lokal, jadi
 * yang diterima di sini hanya berkas di folder logo mitra. URL luar
 * ditolak karena next/image memang tidak mengizinkan host di luar
 * remotePatterns.
 */
export function logoSrc(c: Pick<Community, 'logo'>): string | null {
  const l = c.logo;
  return l && /^\/assets\/community\/[a-z0-9-]+\.(webp|png|jpe?g)$/i.test(l) ? l : null;
}

/** Aturan 4: tanpa jumlah anggota, tulisannya "Komunitas", bukan angka. */
export function memberCount(members: number | null): string | null {
  if (!members) return null;
  return members >= 1000 ? `${(members / 1000).toFixed(1).replace('.0', '')}k` : String(members);
}

/* Nama platform tidak diterjemahkan: itu nama merek. Urutan ini juga
   urutan tampil di kartu samping. */
export const PLATFORMS: { key: string; label: string; icon: string }[] = [
  { key: 'website', label: 'Website', icon: 'globe' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'wa' },
  { key: 'instagram', label: 'Instagram', icon: 'ig' },
  { key: 'discord', label: 'Discord', icon: 'discord' },
  { key: 'telegram', label: 'Telegram', icon: 'tg' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok' },
  { key: 'youtube', label: 'YouTube', icon: 'yt' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { key: 'facebook', label: 'Facebook', icon: 'fb' },
  { key: 'twitter', label: 'X', icon: 'x' },
  { key: 'github', label: 'GitHub', icon: 'gh' },
  { key: 'email', label: 'Email', icon: 'mail' },
];

/** Aturan 1 dan 6: tautan kosong atau tidak sah tidak dirender sama sekali. */
export function platformLinks(c: Pick<Community, 'links'>) {
  return PLATFORMS.flatMap((p) => {
    const href = safeHref(c.links[p.key]);
    return href ? [{ ...p, href }] : [];
  });
}
