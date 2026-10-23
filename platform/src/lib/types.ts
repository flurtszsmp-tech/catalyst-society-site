/* ===========================================================
   Tipe domain Catalyst Passport.

   Nama kolom di database memakai snake_case; di aplikasi camelCase.
   Konversinya hanya terjadi di src/lib/repo/supabase.ts dan
   src/lib/public-profile.ts, tidak di komponen.
   =========================================================== */

export type Localized = { id: string; en: string; zh: string };

/**
 * Tujuh tahap Journey, berurutan. Sama dengan private.recompute_journey di
 * supabase/migrations/0002_journey_v2.sql: tiap tahap mensyaratkan tahap
 * sebelumnya, dan tahap hanya naik.
 */
export type Stage =
  | 'explorer'
  | 'connector'
  | 'challenger'
  | 'innovator'
  | 'contributor'
  | 'builder'
  | 'founder';

export const STAGES: Stage[] = [
  'explorer',
  'connector',
  'challenger',
  'innovator',
  'contributor',
  'builder',
  'founder',
];

export type Channel = 'investments' | 'ai' | 'business' | 'builder' | 'impact';

/** Kunci yang diterima kolom profiles.links. Harus sama dengan links_are_valid di SQL. */
export type LinkKey =
  | 'linkedin'
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'github'
  | 'website'
  | 'portfolio'
  | 'facebook'
  | 'telegram';

export const LINK_KEYS: LinkKey[] = [
  'linkedin',
  'instagram',
  'twitter',
  'youtube',
  'tiktok',
  'github',
  'website',
  'portfolio',
  'facebook',
  'telegram',
];

export type CvVisibility = 'private' | 'public';

export interface Profile {
  id: string;
  catalystId: string;
  slug: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  about: string | null;
  /** Path di bucket avatars. Diutamakan di atas avatarUrl. */
  avatarPath: string | null;
  /** Foto dari penyedia login, misalnya Google. */
  avatarUrl: string | null;
  channel: Channel | null;
  journeyStage: Stage;
  /** Tahap terakhir yang sudah dirayakan pop up ucapan di layar pemiliknya. */
  journeySeenStage: Stage;
  cataPoints: number;
  isVerified: boolean;
  isPublic: boolean;
  links: Partial<Record<LinkKey, string>>;
  skills: string[];
  roles: string[];
  cvFileName: string | null;
  cvVisibility: CvVisibility;
  createdAt: string;
  updatedAt: string;
}

/** Kolom yang boleh diubah pemilik. Sama persis dengan GRANT UPDATE di SQL. */
export type ProfilePatch = Partial<
  Pick<
    Profile,
    | 'fullName'
    | 'headline'
    | 'location'
    | 'about'
    | 'channel'
    | 'isPublic'
    | 'links'
    | 'skills'
    | 'roles'
    | 'cvVisibility'
    | 'slug'
  >
>;

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  role: string | null;
  /** YYYY-MM-DD */
  startedOn: string | null;
  endedOn: string | null;
  url: string | null;
  collaborators: number;
  createdAt: string;
}

export type ProjectInput = Pick<
  Project,
  'title' | 'description' | 'role' | 'startedOn' | 'endedOn' | 'url' | 'collaborators'
>;

export type CertificateSource = 'self' | 'catalyst';

export interface Certificate {
  id: string;
  userId: string;
  source: CertificateSource;
  title: string;
  issuer: string;
  issuedOn: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  imagePath: string | null;
  isVerified: boolean;
  /** Catatan tim Catalyst saat sertifikat diperiksa. */
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export type CertificateInput = Pick<
  Certificate,
  'title' | 'issuer' | 'issuedOn' | 'credentialId' | 'credentialUrl'
>;

export interface JourneyEvent {
  stage: Stage;
  title: string;
  detail: string | null;
  occurredAt: string;
}

export interface Badge {
  code: string;
  name: string;
  description: string | null;
  icon: string;
}

export interface EarnedBadge extends Badge {
  earnedAt: string;
}

export interface PointEvent {
  delta: number;
  reason: string;
  createdAt: string;
}

/** Ringkasan profil untuk daftar koneksi dan pencarian orang. */
export interface ProfileSummary {
  id: string;
  slug: string;
  fullName: string;
  headline: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  journeyStage: Stage;
  channel?: Channel | null;
  cataPoints?: number;
  skills?: string[];
  roles?: string[];
}

/** Saringan halaman Temukan orang. Kosong berarti tidak disaring. */
export interface PeopleFilter {
  query: string;
  channel: Channel | null;
  stage: Stage | null;
  /** Hanya orang yang punya setidaknya satu lencana yang sama dengan saya. */
  sameBadges: boolean;
  /** Hanya orang dengan setidaknya satu keahlian yang sama dengan saya. */
  sameSkills: boolean;
  /** Hanya orang dengan setidaknya satu peran yang sama dengan saya. */
  sameRoles: boolean;
  /** Sembunyikan orang yang sudah saya ikuti. */
  hideFollowing: boolean;
  sort: 'points_desc' | 'points_asc' | 'newest';
}

export const DEFAULT_PEOPLE_FILTER: PeopleFilter = {
  query: '',
  channel: null,
  stage: null,
  sameBadges: false,
  sameSkills: false,
  sameRoles: false,
  hideFollowing: true,
  sort: 'points_desc',
};

/* ---------- verifikasi ---------- */

export type MembershipStatus = 'pending' | 'verified' | 'rejected';

/** Keanggotaan komunitas milik sendiri, lengkap dengan status pemeriksaan tim. */
export interface Membership {
  slug: string;
  status: MembershipStatus;
  /** Bukti keanggotaan: username, tautan profil, atau nomor anggota. */
  proof: string | null;
  reviewNote: string | null;
  joinedAt: string;
}

/** Tahap yang syaratnya berada di luar Passport dan diperiksa tim Catalyst. */
export type ClaimKind = 'bootcamp' | 'finder' | 'labs' | 'founder';

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface JourneyClaim {
  id: string;
  kind: ClaimKind;
  detail: string;
  url: string | null;
  /** Valuasi bisnis dalam rupiah, hanya untuk klaim Founder. */
  valuation: number | null;
  status: ClaimStatus;
  reviewNote: string | null;
  createdAt: string;
}

export type ClaimInput = Pick<JourneyClaim, 'kind' | 'detail' | 'url' | 'valuation'>;

/** Angka mentah untuk syarat tiap tahap, dibaca dari data milik sendiri. */
export interface JourneyProgress {
  verifiedCommunities: number;
  pendingCommunities: number;
  following: number;
  certificates: number;
  projects: number;
  claims: JourneyClaim[];
}

/** Antrean pemeriksaan admin: hanya pengajuan tahap Journey. */
export interface ReviewQueue {
  claims: { person: ProfileSummary; claim: JourneyClaim }[];
}

/* ---------- masukan dan admin ---------- */

export type FeedbackKind = 'saran' | 'masalah' | 'pertanyaan' | 'lainnya';
export type FeedbackStatus = 'baru' | 'dibaca' | 'selesai';

export interface Feedback {
  id: number;
  userId: string | null;
  kind: FeedbackKind;
  message: string;
  page: string | null;
  status: FeedbackStatus;
  createdAt: string;
}

export type CollaborationStatus = 'baru' | 'ditinjau' | 'dihubungi' | 'berjalan' | 'selesai' | 'ditolak';

/** Permintaan kolaborasi dari formulir di landing (public.collaboration_requests). */
export interface Collaboration {
  id: string;
  refNo: string;
  userId: string | null;
  fullName: string;
  jobTitle: string | null;
  email: string;
  phone: string | null;
  organization: string | null;
  orgType: string | null;
  website: string | null;
  kinds: string[];
  industries: string[];
  budget: string | null;
  timeline: string | null;
  contactPref: string | null;
  source: string | null;
  message: string;
  status: CollaborationStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Data akun yang aman dibaca admin. Kata sandi dan token tidak pernah ikut. */
export interface AdminAccount {
  id: string;
  email: string | null;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
}

export interface AdminActivity {
  kind: string;
  userId: string | null;
  detail: string;
  at: string;
}

/** Semua yang dibutuhkan panel detail satu pengguna di dashboard admin. */
export interface AdminUserDetail {
  bundle: PassportBundle;
  points: PointEvent[];
  claims: JourneyClaim[];
  feedback: Feedback[];
  views30d: number;
  cvLink: string | null;
}

export interface DailyCount {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

export interface SessionUser {
  id: string;
  email: string | null;
  /** 'google' | 'email' | 'demo' */
  provider: string;
}

/** Seluruh isi Passport satu orang, dipakai halaman publik dan beranda. */
export interface PassportBundle {
  profile: Profile;
  journey: JourneyEvent[];
  badges: EarnedBadge[];
  communities: string[];
  projects: Project[];
  certificates: Certificate[];
  followers: number;
  following: number;
}
