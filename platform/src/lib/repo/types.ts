import type {
  Badge,
  Certificate,
  CertificateInput,
  ClaimInput,
  DailyCount,
  EarnedBadge,
  JourneyClaim,
  JourneyEvent,
  JourneyProgress,
  Membership,
  PeopleFilter,
  PointEvent,
  Profile,
  ProfilePatch,
  ProfileSummary,
  Project,
  PassportBundle,
  ProjectInput,
  ReviewQueue,
  SessionUser,
  Stage,
} from '@/lib/types';

/**
 * Satu kontrak untuk seluruh data Catalyst Passport di browser.
 *
 * Dua implementasi:
 *   DemoRepo      data contoh di localStorage, tanpa login
 *   SupabaseRepo  data sungguhan; setiap baris dijaga RLS di database
 *
 * Komponen hanya boleh memanggil metode di sini, tidak pernah Supabase
 * langsung, supaya mode demo dan produksi berperilaku sama.
 *
 * Semua metode melempar RepoError dengan pesan berbahasa Indonesia yang
 * siap ditampilkan ke pengguna.
 */
export interface PassportRepo {
  readonly mode: 'demo' | 'supabase';

  // ---------- sesi ----------
  getSessionUser(): Promise<SessionUser | null>;
  signOut(): Promise<void>;

  // ---------- profil ----------
  getMyProfile(): Promise<Profile | null>;
  updateMyProfile(patch: ProfilePatch): Promise<Profile>;
  /** true bila slug belum dipakai orang lain. */
  isSlugAvailable(slug: string): Promise<boolean>;
  uploadAvatar(file: File): Promise<Profile>;
  removeAvatar(): Promise<Profile>;
  /** CV opsional, PDF, maksimal 5 MB. */
  uploadCv(file: File): Promise<Profile>;
  removeCv(): Promise<Profile>;
  /** Tautan sementara untuk membuka CV. null bila tidak ada atau tidak boleh dibaca. */
  getCvUrl(profile: Pick<Profile, 'id' | 'cvFileName'>): Promise<string | null>;

  // ---------- capaian ----------
  listJourney(userId: string): Promise<JourneyEvent[]>;
  listEarnedBadges(userId: string): Promise<EarnedBadge[]>;
  listAllBadges(): Promise<Badge[]>;
  /** Riwayat poin milik sendiri, terbaru di akhir. */
  listMyPointEvents(): Promise<PointEvent[]>;
  /** Angka syarat tiap tahap Journey milik sendiri. */
  getJourneyProgress(): Promise<JourneyProgress>;
  /** Klaim tahap yang diperiksa tim: bootcamp, Finder, Labs, Founder. */
  listMyClaims(): Promise<JourneyClaim[]>;
  submitClaim(input: ClaimInput): Promise<JourneyClaim>;
  /** Hanya klaim yang masih menunggu. */
  cancelClaim(id: string): Promise<void>;
  /** Menandai pop up ucapan untuk tahap ini sudah dilihat. */
  markJourneySeen(stage: Stage): Promise<void>;

  // ---------- komunitas ----------
  /** Slug komunitas terverifikasi milik userId. Ini yang tampil di profil. */
  listCommunities(userId: string): Promise<string[]>;
  /** Seluruh keanggotaan milik sendiri, termasuk yang menunggu atau ditolak. */
  listMyMemberships(): Promise<Membership[]>;
  /** Bergabung berarti mengajukan: tim memeriksa bukti sebelum diterima. */
  joinCommunity(slug: string, proof: string): Promise<void>;
  /** Mengganti bukti. Keanggotaan yang ditolak kembali masuk antrean. */
  updateMembershipProof(slug: string, proof: string): Promise<void>;
  leaveCommunity(slug: string): Promise<void>;

  // ---------- projek ----------
  listProjects(userId: string): Promise<Project[]>;
  createProject(input: ProjectInput): Promise<Project>;
  updateProject(id: string, input: ProjectInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // ---------- sertifikat ----------
  listCertificates(userId: string): Promise<Certificate[]>;
  /** image opsional: JPG/PNG/WebP maksimal 5 MB. */
  createCertificate(input: CertificateInput, image?: File | null): Promise<Certificate>;
  /** image: File untuk mengganti, null untuk menghapus, undefined untuk membiarkan. */
  updateCertificate(id: string, input: CertificateInput, image?: File | null): Promise<Certificate>;
  deleteCertificate(id: string): Promise<void>;

  // ---------- koneksi ----------
  listFollowing(userId: string): Promise<ProfileSummary[]>;
  listFollowers(userId: string): Promise<ProfileSummary[]>;
  countConnections(userId: string): Promise<{ followers: number; following: number }>;
  follow(profileId: string): Promise<void>;
  unfollow(profileId: string): Promise<void>;
  /** Cari profil publik berdasarkan nama atau headline. */
  searchProfiles(query: string): Promise<ProfileSummary[]>;
  /** Temukan orang dengan saringan industri, lencana, keahlian, peran, dan urutan poin. */
  searchPeople(filter: PeopleFilter): Promise<ProfileSummary[]>;

  // ---------- analitik ----------
  /** Kunjungan profil per hari untuk `days` hari terakhir, termasuk hari kosong. */
  getProfileViews(days: number): Promise<DailyCount[]>;
  /**
   * Mencatat satu kunjungan ke profil publik. Dipanggil dari browser,
   * bukan saat render server, supaya bot dan crawler pratinjau tautan
   * tidak ikut terhitung. Tidak pernah melempar.
   */
  recordProfileView(slug: string): Promise<void>;
  /**
   * Isi profil publik untuk slug tertentu, dibaca di browser (ekspor statis tanpa server).
   * null berarti tidak ada atau tidak boleh dilihat; keduanya diperlakukan sama.
   */
  getPublicBundle(slug: string): Promise<PassportBundle | null>;

  // ---------- tim Catalyst ----------
  /** true bila pengguna yang masuk anggota tim pemeriksa. */
  isStaff(): Promise<boolean>;
  /** Semua yang menunggu pemeriksaan. Hanya terbaca tim. */
  getReviewQueue(): Promise<ReviewQueue>;
  reviewMembership(userId: string, slug: string, approve: boolean, note?: string): Promise<void>;
  reviewCertificate(id: string, approve: boolean, note?: string): Promise<void>;
  reviewClaim(id: string, approve: boolean, note?: string): Promise<void>;

  // ---------- akun ----------
  /** Kata sandi baru untuk akun email, minimal 8 karakter. Akun Google tidak memakainya. */
  updatePassword(newPassword: string): Promise<void>;
  /** Menghapus akun beserta seluruh berkas. Tidak bisa dibatalkan. */
  deleteMyAccount(): Promise<void>;
}

export class RepoError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'RepoError';
  }
}

/* ---------- batas berkas, sama dengan bucket di SQL ---------- */
export const LIMITS = {
  avatarBytes: 2 * 1024 * 1024,
  avatarTypes: ['image/jpeg', 'image/png', 'image/webp'],
  cvBytes: 5 * 1024 * 1024,
  cvTypes: ['application/pdf'],
  certBytes: 5 * 1024 * 1024,
  certTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

/**
 * Nama tampilan CV yang disimpan di cv_file_name. Berkasnya sendiri
 * selalu <uid>/cv.pdf; nama ini hanya label, jadi dibuat memenuhi CHECK
 * database: tanpa garis miring, paling panjang 120, berakhiran .pdf.
 */
export function cvDisplayName(raw: string): string {
  const dasar = raw
    .replace(/[\\/]+/g, ' ')
    .replace(/\.pdf$/i, '')
    .trim()
    .slice(0, 112);
  return `${dasar || 'CV'}.pdf`;
}

export function assertFile(
  file: File,
  types: readonly string[],
  maxBytes: number,
  label: string,
): void {
  if (!types.includes(file.type)) {
    const nama = types.map((t) => t.split('/')[1].toUpperCase()).join(', ');
    throw new RepoError(`${label} harus berformat ${nama}.`);
  }
  if (file.size > maxBytes) {
    throw new RepoError(`${label} maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
}

/** Slug profil: huruf kecil, angka, tanda hubung, 3 sampai 40 karakter. */
export const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/;
