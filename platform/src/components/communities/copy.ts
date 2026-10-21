/* Teks milik halaman komunitas saja, dipindah dari assets/js/communities.js.
   Kamus bersama (DICT) hanya memuat kepala halaman direktori; sisanya
   tinggal di sini supaya tidak ikut membengkakkan kamus situs. */
import { useLang } from '@/lib/i18n/provider';
import type { Lang } from '@/lib/i18n/dict';

export interface CommunityCopy {
  semua: string;
  cari: string;
  saring: string;
  kosong: string;
  reset: string;
  hitung: (n: number) => string;
  komunitas: string;
  anggota: string;
  mitra: string;
  gabung: string;
  gabungSoon: string;
  catatan: string;
  catatanKosong: string;
  tabBaru: string;
  platform: string;
  terkait: string;
  kembali: string;
  takAda: string;
  takAdaSub: string;
  keanggotaan: Record<'free' | 'premium' | 'selective', string>;
  passportTambah: string;
  passportHapus: string;
  passportMasuk: string;
  passportDitambah: string;
  passportDihapus: string;
}

/* Nama jenis keanggotaan tidak diterjemahkan, sama seperti situs lama. */
const KEANGGOTAAN = {
  free: 'Free Membership',
  premium: 'Premium Membership',
  selective: 'Selective Membership',
};

const TEKS: Record<Lang, CommunityCopy> = {
  id: {
    semua: 'Semua',
    cari: 'Cari komunitas',
    saring: 'Saring menurut kanal',
    kosong: 'Tidak ada komunitas yang cocok.',
    reset: 'Tampilkan semua',
    hitung: (n) => `${n} komunitas`,
    komunitas: 'Komunitas',
    anggota: 'anggota',
    mitra: 'Mitra resmi',
    gabung: 'Gabung Komunitas',
    gabungSoon: 'Segera',
    catatan: 'Tombol ini membuka kanal resmi komunitas.',
    catatanKosong: 'Kanal pendaftaran komunitas ini belum tersedia.',
    tabBaru: '(membuka tab baru)',
    platform: 'Platform',
    terkait: 'Komunitas terkait',
    kembali: 'Semua komunitas',
    takAda: 'Komunitas tidak ditemukan',
    takAdaSub: 'Tautan yang Anda buka tidak cocok dengan komunitas mana pun di direktori.',
    keanggotaan: KEANGGOTAAN,
    passportTambah: 'Tambahkan ke Passport',
    passportHapus: 'Hapus dari Passport',
    passportMasuk: 'Masuk dulu untuk menyimpan komunitas ini di Passport Anda.',
    passportDitambah: 'Komunitas ini sudah tersimpan di Passport Anda.',
    passportDihapus: 'Komunitas ini dihapus dari Passport Anda.',
  },
  en: {
    semua: 'All',
    cari: 'Search communities',
    saring: 'Filter by channel',
    kosong: 'No community matches that.',
    reset: 'Show all',
    hitung: (n) => `${n} ${n === 1 ? 'community' : 'communities'}`,
    komunitas: 'Community',
    anggota: 'members',
    mitra: 'Official partner',
    gabung: 'Join Community',
    gabungSoon: 'Soon',
    catatan: "This opens the community's official channel.",
    catatanKosong: 'This community has no open sign-up channel yet.',
    tabBaru: '(opens in a new tab)',
    platform: 'Platforms',
    terkait: 'Related communities',
    kembali: 'All communities',
    takAda: 'Community not found',
    takAdaSub: 'The link you opened does not match any community in the directory.',
    keanggotaan: KEANGGOTAAN,
    passportTambah: 'Add to Passport',
    passportHapus: 'Remove from Passport',
    passportMasuk: 'Sign in first to save this community to your Passport.',
    passportDitambah: 'This community is now saved in your Passport.',
    passportDihapus: 'This community was removed from your Passport.',
  },
  zh: {
    semua: '全部',
    cari: '搜索社区',
    saring: '按频道筛选',
    kosong: '没有匹配的社区。',
    reset: '显示全部',
    hitung: (n) => `${n} 个社区`,
    komunitas: '社区',
    anggota: '名成员',
    mitra: '官方合作伙伴',
    gabung: '加入社区',
    gabungSoon: '即将',
    catatan: '此按钮将打开该社区的官方渠道。',
    catatanKosong: '该社区暂未开放报名渠道。',
    tabBaru: '（在新标签页打开）',
    platform: '平台',
    terkait: '相关社区',
    kembali: '全部社区',
    takAda: '未找到该社区',
    takAdaSub: '您打开的链接与目录中的任何社区都不匹配。',
    keanggotaan: KEANGGOTAAN,
    passportTambah: '添加到 Passport',
    passportHapus: '从 Passport 移除',
    passportMasuk: '请先登录，才能把这个社区保存到你的 Passport。',
    passportDitambah: '该社区已保存到你的 Passport。',
    passportDihapus: '该社区已从你的 Passport 移除。',
  },
};

export function useCommunityCopy(): CommunityCopy {
  const { lang } = useLang();
  return TEKS[lang] ?? TEKS.id;
}
