/* ===========================================================
   Nama tahap Journey dan alasan poin CATA.

   Aturan di sini mengikuti trigger di supabase/migrations/0001_init.sql,
   bukan janji pemasaran: hanya Connector dan Builder yang bisa dicapai
   sendiri dari Passport. Tiga tahap terakhir diberikan tim Catalyst.
   =========================================================== */
import type { Stage } from '@/lib/types';

export interface StageInfo {
  name: string;
  /** Satu baris: apa arti tahap ini. */
  summary: string;
  /** Cara mencapainya, ditampilkan saat tahap ini menjadi tujuan. */
  how: string;
  /** Halaman tempat syaratnya bisa dipenuhi. */
  href?: string;
  cta?: string;
  /** Jumlah yang dibutuhkan, untuk bilah kemajuan. */
  target?: number;
  unit?: string;
}

const PROGRAM =
  'Tahap ini diberikan tim Catalyst melalui program Catalyst, bukan dari aktivitas di Passport, jadi tidak ada yang perlu diisi di sini.';

export const STAGE_INFO: Record<Stage, StageInfo> = {
  explorer: {
    name: 'Explorer',
    summary: 'Bergabung dengan Catalyst Society',
    how: 'Diberikan otomatis saat Catalyst Passport dibuat.',
  },
  connector: {
    name: 'Connector',
    summary: 'Bergabung ke tiga komunitas',
    how: 'Tambahkan tiga komunitas mitra ke Passport Anda. Hadiahnya +30 poin CATA.',
    href: '/passport/communities',
    cta: 'Buka Komunitas',
    target: 3,
    unit: 'komunitas',
  },
  builder: {
    name: 'Builder',
    summary: 'Membuat projek pertama',
    how: 'Tambahkan projek pertama Anda. Hadiahnya +50 poin CATA serta lencana First Project dan Builder.',
    href: '/passport/projects',
    cta: 'Tambah projek',
    target: 1,
    unit: 'projek',
  },
  challenger: { name: 'Challenger', summary: 'Melalui program Catalyst', how: PROGRAM },
  contributor: { name: 'Contributor', summary: 'Melalui program Catalyst', how: PROGRAM },
  innovator: { name: 'Innovator', summary: 'Melalui program Catalyst', how: PROGRAM },
};

const REASON_LABEL: Record<string, string> = {
  signup: 'Membuat Catalyst Passport',
  first_community: 'Bergabung ke komunitas pertama',
  connector: 'Tahap Connector: tiga komunitas',
  community_explorer: 'Community Explorer: lima komunitas',
  first_project: 'Menambahkan projek pertama',
  builder_badge: 'Lencana Builder',
  profile_complete: 'Melengkapi profil',
  certified: 'Sertifikat terverifikasi',
};

/** Alasan yang belum dikenal aplikasi tetap tampil, tanpa memperlihatkan kode mentahnya. */
export const OTHER_REASON = 'Aktivitas lainnya';

export function reasonLabel(reason: string): string {
  return REASON_LABEL[reason] ?? OTHER_REASON;
}
