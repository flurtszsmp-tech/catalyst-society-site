/* ===========================================================
   Tipe domain Catalyst Passport.

   Nama kolom di database memakai snake_case; di aplikasi camelCase.
   Konversinya hanya terjadi di src/lib/repo/supabase.ts dan
   src/lib/public-profile.ts, tidak di komponen.
   =========================================================== */

export type Localized = { id: string; en: string; zh: string };

export type Stage =
  | 'explorer'
  | 'connector'
  | 'builder'
  | 'challenger'
  | 'contributor'
  | 'innovator';

export const STAGES: Stage[] = [
  'explorer',
  'connector',
  'builder',
  'challenger',
  'contributor',
  'innovator',
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
