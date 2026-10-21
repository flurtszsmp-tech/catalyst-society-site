/* ===========================================================
   Pembantu tampilan untuk kartu Passport. Murni, tanpa state, aman
   dipakai di server (halaman publik) maupun di browser (dasbor).
   =========================================================== */
import { SUPABASE_URL } from '@/lib/env';
import { STAGES, type PointEvent, type Stage } from '@/lib/types';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function angka(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n || 0);
}

/**
 * "2026-03-21" atau stempel waktu ISO menjadi "Mar 2026". Dibaca dari
 * teksnya, bukan lewat Date, supaya tanggal tanpa jam tidak bergeser ke
 * bulan sebelumnya di zona waktu barat.
 */
export function bulanTahun(d: string | null | undefined): string {
  const m = d ? /^(\d{4})-(\d{2})/.exec(d) : null;
  if (!m) return '';
  return `${BULAN[Number(m[2]) - 1] ?? ''} ${m[1]}`;
}

export function stageName(s: Stage): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Posisi tahap dari 0 sampai 5. Nilai asing dianggap tahap pertama. */
export function stageIndex(s: Stage): number {
  return Math.max(0, STAGES.indexOf(s));
}

/** Keterangan bawaan untuk tahap yang belum punya catatan journey. */
export const STAGE_DETAIL: Record<Stage, string> = {
  explorer: 'Bergabung dengan Catalyst Society',
  connector: 'Bergabung ke tiga komunitas',
  builder: 'Membuat projek pertama',
  challenger: 'Menuntaskan bootcamp',
  contributor: 'Membantu lima projek',
  innovator: 'Dampak dan skala',
};

export interface SeriesPoint {
  label: string;
  value: number;
}

/**
 * Total poin di akhir tiap bulan, `months` bulan terakhir. Dihitung
 * mundur dari total profil, bukan maju dari nol, supaya titik terakhir
 * selalu sama dengan angka besar di kartu walaupun riwayat lama tidak
 * lengkap.
 */
export function pointsSeries(events: PointEvent[], total: number, now = new Date(), months = 6): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const awal = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const akhir = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const sesudah = events.reduce((s, e) => (new Date(e.createdAt) >= akhir ? s + e.delta : s), 0);
    out.push({ label: BULAN[awal.getMonth()], value: Math.max(0, total - sesudah) });
  }
  return out;
}

/** Jumlah poin yang didapat sejak awal bulan berjalan. */
export function monthDelta(events: PointEvent[], now = new Date()): number {
  const awal = new Date(now.getFullYear(), now.getMonth(), 1);
  return events.reduce((s, e) => (new Date(e.createdAt) >= awal ? s + e.delta : s), 0);
}

/**
 * true bila next/image boleh mengoptimalkan gambar ini, yaitu bila
 * asalnya terdaftar di images.remotePatterns (next.config.ts). Asal lain
 * tetap tampil apa adanya; tanpa pemeriksaan ini next/image melempar
 * galat untuk host yang tidak dikenal.
 */
export function canOptimize(src: string): boolean {
  if (SUPABASE_URL && src.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`)) return true;
  try {
    // Harus sama dengan remotePatterns di next.config.ts.
    const u = new URL(src);
    return u.hostname === 'lh3.googleusercontent.com' && u.pathname.startsWith('/a/');
  } catch {
    return false;
  }
}

/** Path aset lokal dari data tim sendiri (logo komunitas). Menolak URL luar dan //host. */
export function localAsset(p: string | null | undefined): string | null {
  return p && /^\/(?![/\\])[\w\-./]+$/.test(p) ? p : null;
}
