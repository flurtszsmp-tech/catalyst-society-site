/* ===========================================================
   Aturan tujuh tahap Journey.

   Satu sumber untuk halaman Journey, kartu ucapan, dan mode demo. Isinya
   harus sama dengan private.recompute_journey di
   supabase/migrations/0002_journey_v2.sql; database tetap yang memutuskan,
   berkas ini hanya menjelaskan dan menghitung kemajuan untuk tampilan.

   Modul netral: tanpa 'use client', aman dipakai di mana saja.
   =========================================================== */
import { STAGES, type ClaimKind, type ClaimStatus, type JourneyProgress, type Stage } from '@/lib/types';

export interface Requirement {
  key: string;
  label: string;
  /** Jumlah yang dibutuhkan untuk syarat hitungan. */
  target?: number;
  unit?: string;
  /** Syarat yang diperiksa tim lewat pengajuan. */
  claim?: ClaimKind;
  href?: string;
  cta?: string;
}

export interface StageRule {
  name: string;
  /** Satu baris untuk kartu dan linimasa. */
  summary: string;
  /** Penjelasan untuk halaman Journey. */
  about: string;
  requirements: Requirement[];
  /** Poin CATA saat tahap ini tercapai. Poin tidak menaikkan tahap. */
  points: number;
  /** Hadiah di luar poin. */
  perk?: string;
  exclusive?: boolean;
}

export const STAGE_RULES: Record<Stage, StageRule> = {
  explorer: {
    name: 'Explorer',
    summary: 'Bergabung dengan Catalyst Society',
    about: 'Titik awal setiap anggota. Catalyst Passport Anda dibuat dan Catalyst ID diterbitkan.',
    requirements: [{ key: 'signup', label: 'Membuat Catalyst Passport' }],
    points: 0,
  },
  connector: {
    name: 'Connector',
    summary: 'Lima komunitas dan lima koneksi',
    about:
      'Anda mulai membangun jaringan: aktif di komunitas mitra dan terhubung dengan sesama anggota. Keanggotaan komunitas diperiksa tim Catalyst supaya tidak ada yang sekadar menekan tombol Gabung.',
    requirements: [
      { key: 'communities', label: 'Komunitas terverifikasi', target: 5, unit: 'komunitas', href: '/passport/communities', cta: 'Buka Komunitas' },
      { key: 'following', label: 'Koneksi yang Anda ikuti', target: 5, unit: 'orang', href: '/passport/connections', cta: 'Temukan orang' },
    ],
    points: 25,
  },
  challenger: {
    name: 'Challenger',
    summary: 'Sertifikat dan sesi bootcamp',
    about: 'Anda menantang diri untuk belajar: punya sertifikat dan menuntaskan setidaknya satu sesi bootcamp Catalyst.',
    requirements: [
      { key: 'certificates', label: 'Sertifikat diunggah', target: 1, unit: 'sertifikat', href: '/passport/certificates', cta: 'Tambah sertifikat' },
      { key: 'bootcamp', label: 'Satu sesi bootcamp selesai', claim: 'bootcamp' },
    ],
    points: 50,
  },
  innovator: {
    name: 'Innovator',
    summary: 'Membangun projek atau komunitas',
    about: 'Anda pernah membangun sesuatu: projek, produk, atau komunitas dari pengalaman sebelumnya. Tambahkan ke bagian Projects.',
    requirements: [
      { key: 'projects', label: 'Projek atau komunitas yang pernah dibangun', target: 1, unit: 'projek', href: '/passport/projects', cta: 'Tambah projek' },
    ],
    points: 75,
  },
  contributor: {
    name: 'Contributor',
    summary: 'Membantu projek di Catalyst Finder',
    about: 'Anda ikut membantu projek orang lain melalui Catalyst Finder, sebagai kolaborator, mentor, atau relawan.',
    requirements: [{ key: 'finder', label: 'Kontribusi di Catalyst Finder', claim: 'finder' }],
    points: 100,
  },
  builder: {
    name: 'Builder',
    summary: 'Membangun projek di Catalyst Labs',
    about: 'Anda membangun projek sendiri bersama Catalyst Labs, dari ide sampai berjalan.',
    requirements: [{ key: 'labs', label: 'Projek di Catalyst Labs', claim: 'labs' }],
    points: 150,
  },
  founder: {
    name: 'Founder',
    summary: 'Bisnis bervaluasi di atas Rp100 juta',
    about:
      'Akses eksklusif untuk pemilik bisnis dengan valuasi di atas Rp100 juta. Diverifikasi langsung oleh tim Catalyst, dan setiap Founder mendapat merchandise eksklusif Catalyst.',
    requirements: [{ key: 'founder', label: 'Bisnis bervaluasi di atas Rp100 juta, diverifikasi tim', claim: 'founder' }],
    points: 300,
    perk: 'Merchandise eksklusif Catalyst',
    exclusive: true,
  },
};

/** Keterangan pengajuan per jenis, untuk formulir dan antrean tim. */
export const CLAIM_INFO: Record<ClaimKind, { stage: Stage; title: string; hint: string; urlLabel: string }> = {
  bootcamp: {
    stage: 'challenger',
    title: 'Sesi bootcamp',
    hint: 'Nama bootcamp, batch, dan tanggal sesi yang Anda selesaikan.',
    urlLabel: 'Tautan sertifikat atau bukti kehadiran (opsional)',
  },
  finder: {
    stage: 'contributor',
    title: 'Kontribusi di Catalyst Finder',
    hint: 'Projek yang Anda bantu, peran Anda, dan apa yang Anda kerjakan.',
    urlLabel: 'Tautan projek di Catalyst Finder (opsional)',
  },
  labs: {
    stage: 'builder',
    title: 'Projek di Catalyst Labs',
    hint: 'Nama projek, masalah yang diselesaikan, dan tahap projek saat ini.',
    urlLabel: 'Tautan projek atau demo (opsional)',
  },
  founder: {
    stage: 'founder',
    title: 'Verifikasi Founder',
    hint: 'Nama bisnis, bidang usaha, dan dasar valuasi (laporan keuangan, putaran pendanaan, atau penilaian).',
    urlLabel: 'Tautan situs bisnis atau dokumen pendukung (opsional)',
  },
};

export interface RequirementState extends Requirement {
  have: number;
  done: boolean;
  /** Status pengajuan untuk syarat yang diperiksa tim. */
  claimStatus?: ClaimStatus;
}

function claimStatus(p: JourneyProgress, kind: ClaimKind): ClaimStatus | undefined {
  // Klaim terbaru menang; klaim yang diterima tidak pernah tertimpa yang ditolak.
  if (p.claims.some((c) => c.kind === kind && c.status === 'approved')) return 'approved';
  if (p.claims.some((c) => c.kind === kind && c.status === 'pending')) return 'pending';
  if (p.claims.some((c) => c.kind === kind && c.status === 'rejected')) return 'rejected';
  return undefined;
}

export function requirementStates(stage: Stage, p: JourneyProgress): RequirementState[] {
  return STAGE_RULES[stage].requirements.map((r) => {
    if (r.claim) {
      const st = claimStatus(p, r.claim);
      return { ...r, have: st === 'approved' ? 1 : 0, done: st === 'approved', claimStatus: st };
    }
    const have =
      r.key === 'communities'
        ? p.verifiedCommunities
        : r.key === 'following'
          ? p.following
          : r.key === 'certificates'
            ? p.certificates
            : r.key === 'projects'
              ? p.projects
              : 1;
    return { ...r, have, done: have >= (r.target ?? 1) };
  });
}

/** Tahap tertinggi yang syaratnya terpenuhi berurutan. Sama dengan SQL. */
export function targetStage(p: JourneyProgress): Stage {
  let hasil: Stage = 'explorer';
  for (const s of STAGES.slice(1)) {
    if (!requirementStates(s, p).every((r) => r.done)) break;
    hasil = s;
  }
  return hasil;
}
