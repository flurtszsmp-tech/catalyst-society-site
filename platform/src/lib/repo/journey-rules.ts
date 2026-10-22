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
  /** Penjelasan orang ketiga untuk pengunjung profil publik. */
  publicAbout: string;
  /** Tiga hal yang ditunjukkan tahap ini kepada pengunjung profil publik. */
  signals: string[];
  requirements: Requirement[];
  /** Poin CATA saat tahap ini tercapai. Poin tidak menaikkan tahap. */
  points: number;
  /** Hadiah di luar poin. */
  perk?: string;
  exclusive?: boolean;
  /** Langkah praktis untuk memenuhi syarat, ditampilkan berurutan. */
  steps: string[];
  /** Siapa yang memastikan syaratnya terpenuhi. */
  verifier: 'otomatis' | 'tim';
}

export const STAGE_RULES: Record<Stage, StageRule> = {
  explorer: {
    name: 'Explorer',
    summary: 'Bergabung dengan Catalyst Society',
    about: 'Titik awal setiap anggota. Catalyst Passport Anda dibuat dan Catalyst ID diterbitkan.',
    publicAbout:
      'Tahap awal di Catalyst Society. Anggota pada tahap ini telah memiliki Catalyst Passport dengan Catalyst ID resmi, dan sedang memetakan minat, keahlian, serta arah pengembangan dirinya di dalam ekosistem.',
    signals: ['Identitas profesional tercatat dengan Catalyst ID', 'Terbuka pada komunitas, program, dan kolaborasi', 'Siap membangun jaringan di ekosistem Catalyst'],
    requirements: [{ key: 'signup', label: 'Membuat Catalyst Passport' }],
    points: 0,
    steps: ['Daftar di catalystsociety.id.', 'Lengkapi foto, headline, tentang, dan tiga keahlian untuk +20 poin CATA.'],
    verifier: 'otomatis',
  },
  connector: {
    name: 'Connector',
    summary: 'Lima komunitas dan lima koneksi',
    about:
      'Anda mulai membangun jaringan: aktif di komunitas mitra dan terhubung dengan sesama anggota Catalyst Society.',
    publicAbout:
      'Aktif membangun jaringan lintas komunitas. Anggota pada tahap ini telah bergabung dengan sedikitnya lima komunitas mitra dan terhubung dengan sesama anggota, sehingga berperan sebagai penghubung antara orang, ide, dan peluang di berbagai bidang.',
    signals: ['Terlibat di sedikitnya lima komunitas mitra', 'Jaringan aktif dengan builder, mentor, dan profesional', 'Menjembatani informasi dan peluang lintas komunitas'],
    requirements: [
      { key: 'communities', label: 'Komunitas yang diikuti', target: 5, unit: 'komunitas', href: '/passport/communities', cta: 'Buka Komunitas' },
      { key: 'following', label: 'Koneksi yang Anda ikuti', target: 5, unit: 'orang', href: '/passport/connections', cta: 'Temukan orang' },
    ],
    points: 25,
    steps: [
      'Buka menu Communities dan tambahkan lima komunitas yang Anda ikuti. Grup komunitasnya langsung terbuka.',
      'Buka Connections, gunakan saringan untuk menemukan orang dengan minat serupa, lalu ikuti lima orang.',
      'Tahap Connector terbuka otomatis begitu kedua syarat terpenuhi.',
    ],
    verifier: 'otomatis',
  },
  challenger: {
    name: 'Challenger',
    summary: 'Sertifikat dan sesi bootcamp',
    about: 'Anda menantang diri untuk belajar: punya sertifikat dan menuntaskan setidaknya satu sesi bootcamp Catalyst.',
    publicAbout:
      'Berkomitmen pada pembelajaran yang terstruktur. Anggota pada tahap ini memiliki sertifikat kompetensi dan telah menuntaskan sesi bootcamp Catalyst yang diverifikasi tim, menunjukkan kesungguhan mengasah keahlian secara terukur.',
    signals: ['Kompetensi dibuktikan dengan sertifikat', 'Menuntaskan bootcamp Catalyst terverifikasi', 'Konsisten meningkatkan kapasitas diri'],
    requirements: [
      { key: 'certificates', label: 'Sertifikat diunggah', target: 1, unit: 'sertifikat', href: '/passport/certificates', cta: 'Tambah sertifikat' },
      { key: 'bootcamp', label: 'Satu sesi bootcamp selesai', claim: 'bootcamp' },
    ],
    points: 50,
    steps: [
      'Tambahkan setidaknya satu sertifikat di menu Certificates. Sertifikat dengan ID kredensial atau tautan bukti langsung terverifikasi.',
      'Selesaikan satu sesi bootcamp Catalyst.',
      'Ajukan verifikasi bootcamp di halaman ini dengan nama bootcamp, batch, dan tanggal sesinya.',
    ],
    verifier: 'tim',
  },
  innovator: {
    name: 'Innovator',
    summary: 'Membangun projek atau komunitas',
    about: 'Anda pernah membangun sesuatu: projek, produk, atau komunitas dari pengalaman sebelumnya. Tambahkan ke bagian Projects.',
    publicAbout:
      'Telah mewujudkan gagasan menjadi karya nyata. Anggota pada tahap ini pernah membangun projek, produk, atau komunitas, dan terbukti mampu mengeksekusi ide dari konsep hingga berjalan.',
    signals: ['Portofolio projek atau komunitas yang dibangun sendiri', 'Berpengalaman mengeksekusi ide hingga terealisasi', 'Berorientasi pada solusi dan dampak'],
    requirements: [
      { key: 'projects', label: 'Projek atau komunitas yang pernah dibangun', target: 1, unit: 'projek', href: '/passport/projects', cta: 'Tambah projek' },
    ],
    points: 75,
    steps: [
      'Buka menu Projects dan tambahkan projek, produk, atau komunitas yang pernah Anda bangun.',
      'Sertakan peran Anda, periode, dan tautan bila ada, supaya profil publik Anda lebih meyakinkan.',
      'Tahap Innovator terbuka otomatis sesudah tahap Challenger tercapai.',
    ],
    verifier: 'otomatis',
  },
  contributor: {
    name: 'Contributor',
    summary: 'Membantu projek di Catalyst Finder',
    about: 'Anda ikut membantu projek orang lain melalui Catalyst Finder, sebagai kolaborator, mentor, atau relawan.',
    publicAbout:
      'Berkontribusi langsung pada keberhasilan projek orang lain. Melalui Catalyst Finder, anggota pada tahap ini terlibat sebagai kolaborator, mentor, atau relawan, dan kontribusinya telah diverifikasi tim Catalyst.',
    signals: ['Kontribusi pada projek nyata, diverifikasi tim', 'Terbiasa bekerja dalam tim lintas latar belakang', 'Membagikan keahlian untuk memperkuat ekosistem'],
    requirements: [{ key: 'finder', label: 'Kontribusi di Catalyst Finder', claim: 'finder' }],
    points: 100,
    steps: [
      'Temukan projek yang membutuhkan bantuan di Catalyst Finder.',
      'Berkontribusi sebagai kolaborator, mentor, atau relawan.',
      'Ajukan verifikasi dengan nama projek, peran, dan hasil kontribusi Anda.',
    ],
    verifier: 'tim',
  },
  builder: {
    name: 'Builder',
    summary: 'Membangun projek di Catalyst Labs',
    about: 'Anda membangun projek sendiri bersama Catalyst Labs, dari ide sampai berjalan.',
    publicAbout:
      'Membangun dan memimpin projek sendiri bersama Catalyst Labs. Anggota pada tahap ini membawa gagasannya dari ide, validasi, hingga berjalan dengan pendampingan program, dan diverifikasi tim Catalyst.',
    signals: ['Memimpin projek di Catalyst Labs', 'Mengelola proses dari ide, validasi, hingga eksekusi', 'Siap untuk kolaborasi, pendanaan, dan skala lebih besar'],
    requirements: [{ key: 'labs', label: 'Projek di Catalyst Labs', claim: 'labs' }],
    points: 150,
    steps: [
      'Ikuti program Catalyst Labs dan bangun projek Anda sendiri.',
      'Ajukan verifikasi dengan nama projek, masalah yang diselesaikan, dan tahap projek saat ini.',
    ],
    verifier: 'tim',
  },
  founder: {
    name: 'Founder',
    summary: 'Bisnis bervaluasi di atas Rp100 juta',
    about:
      'Akses eksklusif untuk pemilik bisnis dengan valuasi di atas Rp100 juta. Diverifikasi langsung oleh tim Catalyst, dan setiap Founder mendapat merchandise eksklusif Catalyst.',
    publicAbout:
      'Tingkat tertinggi dalam Journey Catalyst. Anggota pada tahap ini adalah pemilik bisnis dengan valuasi di atas Rp100 juta yang diverifikasi langsung oleh tim Catalyst, dan tergabung dalam jaringan Founder eksklusif Catalyst Society.',
    signals: ['Bisnis berjalan dengan valuasi terverifikasi di atas Rp100 juta', 'Rekam jejak kepemimpinan dan keputusan bisnis', 'Anggota jaringan Founder eksklusif Catalyst'],
    requirements: [{ key: 'founder', label: 'Bisnis bervaluasi di atas Rp100 juta, diverifikasi tim', claim: 'founder' }],
    points: 300,
    perk: 'Merchandise eksklusif Catalyst',
    exclusive: true,
    steps: [
      'Siapkan data bisnis: nama, bidang usaha, dan dasar valuasi.',
      'Ajukan verifikasi Founder dengan valuasi di atas Rp100.000.000 beserta dokumen pendukung.',
      'Tim Catalyst menghubungi Anda untuk verifikasi lanjutan dan pengiriman merchandise eksklusif.',
    ],
    verifier: 'tim',
  },
};

/** Keterangan pengajuan per jenis, untuk formulir dan antrean tim. */
export interface ClaimGuide {
  stage: Stage;
  title: string;
  hint: string;
  urlLabel: string;
  /** Hal yang perlu disiapkan sebelum mengajukan. */
  checklist: string[];
  /** Contoh keterangan yang baik. */
  example: string;
}

export const CLAIM_INFO: Record<ClaimKind, ClaimGuide> = {
  bootcamp: {
    stage: 'challenger',
    title: 'Sesi bootcamp',
    hint: 'Nama bootcamp, batch, dan tanggal sesi yang Anda selesaikan.',
    urlLabel: 'Tautan sertifikat atau bukti kehadiran (opsional)',
    checklist: ['Nama bootcamp dan batch', 'Tanggal sesi yang diselesaikan', 'Sertifikat atau bukti kehadiran, bila ada'],
    example: 'Catalyst Bootcamp AI for Everyone, batch 3, sesi 12 Oktober 2026. Menyelesaikan seluruh materi dan tugas akhir.',
  },
  finder: {
    stage: 'contributor',
    title: 'Kontribusi di Catalyst Finder',
    hint: 'Projek yang Anda bantu, peran Anda, dan apa yang Anda kerjakan.',
    urlLabel: 'Tautan projek di Catalyst Finder (opsional)',
    checklist: ['Nama projek yang dibantu', 'Peran Anda di projek', 'Hasil atau dampak kontribusi'],
    example: 'Membantu projek EcoMicrogrid sebagai relawan developer selama dua bulan: membangun dasbor pemantauan daya.',
  },
  labs: {
    stage: 'builder',
    title: 'Projek di Catalyst Labs',
    hint: 'Nama projek, masalah yang diselesaikan, dan tahap projek saat ini.',
    urlLabel: 'Tautan projek atau demo (opsional)',
    checklist: ['Nama projek di Catalyst Labs', 'Masalah yang diselesaikan', 'Tahap projek saat ini (ide, prototipe, berjalan)'],
    example: 'Membangun aplikasi pencatatan keuangan UMKM di Catalyst Labs batch 2, saat ini prototipe dengan 40 pengguna uji.',
  },
  founder: {
    stage: 'founder',
    title: 'Verifikasi Founder',
    hint: 'Nama bisnis, bidang usaha, dan dasar valuasi (laporan keuangan, putaran pendanaan, atau penilaian).',
    urlLabel: 'Tautan situs bisnis atau dokumen pendukung (opsional)',
    checklist: ['Nama bisnis dan bidang usaha', 'Valuasi bisnis di atas Rp100.000.000', 'Dasar valuasi: laporan keuangan, putaran pendanaan, atau penilaian independen'],
    example: 'PT Contoh Kopi Nusantara, kedai kopi dengan 3 cabang di Jakarta. Valuasi dari putaran angel Agustus 2026.',
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
