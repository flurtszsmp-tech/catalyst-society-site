/* ===========================================================
   Nama tahap Journey dan alasan poin CATA.

   Aturan tahap tinggal di src/lib/repo/journey-rules.ts, yang mengikuti
   private.recompute_journey di supabase/migrations/0002_journey_v2.sql.
   Berkas ini hanya menurunkan label tampilan dari sana.
   =========================================================== */
import { STAGE_RULES } from '@/lib/repo/journey-rules';
import { STAGES, type Stage } from '@/lib/types';

export interface StageInfo {
  name: string;
  summary: string;
}

export const STAGE_INFO: Record<Stage, StageInfo> = Object.fromEntries(
  STAGES.map((s) => [s, { name: STAGE_RULES[s].name, summary: STAGE_RULES[s].summary }]),
) as Record<Stage, StageInfo>;

const REASON_LABEL: Record<string, string> = {
  signup: 'Membuat Catalyst Passport',
  profile_complete: 'Melengkapi profil',
  first_project: 'Menambahkan projek pertama',
  // Alasan dari skema lama, tetap dikenali untuk riwayat yang tersisa.
  first_community: 'Bergabung ke komunitas pertama',
  connector: 'Tahap Connector',
  community_explorer: 'Community Explorer',
  builder_badge: 'Lencana Builder',
  certified: 'Sertifikat terverifikasi',
};

/** Alasan yang belum dikenal aplikasi tetap tampil, tanpa memperlihatkan kode mentahnya. */
export const OTHER_REASON = 'Aktivitas lainnya';

export function reasonLabel(reason: string): string {
  if (REASON_LABEL[reason]) return REASON_LABEL[reason];
  // Alasan berawalan dicatat per komunitas, per sertifikat, dan per tahap.
  if (reason.startsWith('community:')) return 'Komunitas terverifikasi';
  if (reason.startsWith('cert:')) return 'Sertifikat terverifikasi';
  if (reason.startsWith('stage:')) {
    const s = reason.slice(6) as Stage;
    return STAGE_RULES[s] ? `Mencapai tahap ${STAGE_RULES[s].name}` : OTHER_REASON;
  }
  return OTHER_REASON;
}
