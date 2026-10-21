/* ===========================================================
   Data contoh untuk mode demo.

   Dipakai ketika Supabase belum dikonfigurasi. Isinya berasal dari
   assets/js/demo.js lama. Tanggal dihitung mundur dari hari ini supaya
   grafik dan "bulan ini" selalu terlihat hidup, bukan membeku di
   bulan data ini ditulis.

   Profil-profil di SAMPLE_PEOPLE adalah orang rekaan untuk mengisi
   halaman Connections; tidak mewakili siapa pun.
   =========================================================== */
import type {
  Badge,
  Certificate,
  EarnedBadge,
  JourneyClaim,
  JourneyEvent,
  Membership,
  PointEvent,
  Profile,
  ProfileSummary,
  Project,
} from '@/lib/types';

export const DEMO_USER_ID = 'demo';
export const DEMO_SLUG = 'cp-00001';

export const BADGE_CATALOG: Badge[] = [
  { code: 'first_step', name: 'First Step', description: 'Membuat Catalyst Passport', icon: 'spark' },
  { code: 'first_community', name: 'First Community', description: 'Bergabung ke komunitas pertama', icon: 'users' },
  { code: 'community_explorer', name: 'Community Explorer', description: 'Bergabung ke lima komunitas', icon: 'search' },
  { code: 'ecosystem_native', name: 'Ecosystem Native', description: 'Aktif di tiga channel industri', icon: 'globe' },
  { code: 'first_project', name: 'First Project', description: 'Menambahkan projek pertama', icon: 'rocket' },
  { code: 'certified', name: 'Certified', description: 'Memiliki sertifikat terverifikasi', icon: 'badge' },
  { code: 'builder', name: 'Builder', description: 'Mencapai tahap Builder pada Journey', icon: 'cube' },
  { code: 'founder', name: 'Founder', description: 'Pemilik bisnis yang diverifikasi tim Catalyst', icon: 'crown' },
];

export interface DemoState {
  version: 3;
  profile: Profile;
  journey: JourneyEvent[];
  badges: EarnedBadge[];
  /** Keanggotaan beserta status pemeriksaannya. */
  memberships: Membership[];
  claims: JourneyClaim[];
  /** Tautan CV, misalnya Google Drive. */
  cvLink?: string | null;
  projects: Project[];
  certificates: Certificate[];
  points: PointEvent[];
  /** id profil yang diikuti */
  following: string[];
  /** id profil yang mengikuti */
  followers: string[];
  /** kunjungan per hari, kunci YYYY-MM-DD */
  views: Record<string, number>;
}

function iso(d: Date): string {
  return d.toISOString();
}
function day(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function monthsAgo(now: Date, n: number, dayOfMonth = 14): Date {
  return new Date(now.getFullYear(), now.getMonth() - n, dayOfMonth, 10, 0, 0);
}

export const SAMPLE_PEOPLE: ProfileSummary[] = [
  { id: 'demo-p1', slug: 'cp-00002', fullName: 'Nadia Pratiwi', headline: 'Product Designer', avatarPath: null, avatarUrl: null, isVerified: true, journeyStage: 'contributor',
    channel: 'builder', cataPoints: 640, skills: ['Figma', 'Design System', 'Leadership'], roles: ['Designer'] },
  { id: 'demo-p2', slug: 'cp-00003', fullName: 'Raka Aditya', headline: 'Full Stack Developer', avatarPath: null, avatarUrl: null, isVerified: false, journeyStage: 'builder',
    channel: 'builder', cataPoints: 820, skills: ['React', 'Node.js', 'Public Speaking'], roles: ['Developer', 'Founder'] },
  { id: 'demo-p3', slug: 'cp-00004', fullName: 'Sinta Maharani', headline: 'Investment Analyst', avatarPath: null, avatarUrl: null, isVerified: true, journeyStage: 'challenger',
    channel: 'investments', cataPoints: 410, skills: ['Valuation', 'Leadership'], roles: ['Analyst'] },
  { id: 'demo-p4', slug: 'cp-00005', fullName: 'Dimas Saputra', headline: 'AI Engineer', avatarPath: null, avatarUrl: null, isVerified: false, journeyStage: 'connector',
    channel: 'ai', cataPoints: 150, skills: ['Python', 'Machine Learning'], roles: ['Engineer'] },
  { id: 'demo-p5', slug: 'cp-00006', fullName: 'Ayu Lestari', headline: 'Community Lead', avatarPath: null, avatarUrl: null, isVerified: true, journeyStage: 'builder',
    channel: 'impact', cataPoints: 930, skills: ['Community Building', 'Content Creator'], roles: ['Community Builder'] },
  { id: 'demo-p6', slug: 'cp-00007', fullName: 'Fajar Nugroho', headline: 'Founder, Fintech Startup', avatarPath: null, avatarUrl: null, isVerified: false, journeyStage: 'innovator',
    channel: 'business', cataPoints: 560, skills: ['Fundraising', 'Leadership'], roles: ['Founder'] },
];

export function buildDemoSeed(now = new Date()): DemoState {
  const joined = monthsAgo(now, 5);

  const profile: Profile = {
    id: DEMO_USER_ID,
    catalystId: 'CP-00001',
    slug: DEMO_SLUG,
    fullName: 'Bagas Dwi Putra',
    headline: 'Founder of Catalyst Society',
    location: 'Jakarta Selatan, Indonesia',
    about:
      'Founder Catalyst Society, ekosistem yang menghubungkan, menginspirasi, dan mempercepat pertumbuhan builders, innovators, investors, dan changemakers untuk menciptakan dampak positif bagi Indonesia dan dunia.',
    avatarPath: null,
    avatarUrl: null,
    channel: 'business',
    journeyStage: 'connector',
    journeySeenStage: 'connector',
    cataPoints: 270,
    isVerified: true,
    isPublic: true,
    links: {
      linkedin: 'https://www.linkedin.com/in/bagasdwiputra',
      instagram: 'https://www.instagram.com/catalystsociety.id/',
      portfolio: 'https://catalystsociety.id',
    },
    skills: ['Leadership', 'Public Speaking', 'Content Creator'],
    roles: ['Founder', 'Community Builder'],
    cvFileName: null,
    cvVisibility: 'private',
    createdAt: iso(joined),
    updatedAt: iso(now),
  };

  const journey: JourneyEvent[] = [
    { stage: 'explorer', title: 'Explorer', detail: 'Bergabung dengan Catalyst Society', occurredAt: iso(monthsAgo(now, 5)) },
    { stage: 'connector', title: 'Connector', detail: 'Lima komunitas dan lima koneksi', occurredAt: iso(monthsAgo(now, 3, 8)) },
  ];

  const badges: EarnedBadge[] = BADGE_CATALOG.filter((b) => ['first_step', 'first_community', 'community_explorer', 'ecosystem_native', 'first_project'].includes(b.code)).map((b, i) => ({
    ...b,
    earnedAt: iso(monthsAgo(now, Math.max(0, 5 - i))),
  }));

  // Enam bulan, ditutup dengan total yang sama dengan profile.cataPoints.
  const totals = [10, 40, 90, 160, 220, 270];
  const points: PointEvent[] = [];
  let prev = 0;
  totals.forEach((t, i) => {
    points.push({ delta: t - prev, reason: `aktivitas-${i}`, createdAt: iso(monthsAgo(now, 5 - i, 10)) });
    prev = t;
  });

  const views: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    // Pola naik-turun yang wajar, bukan acak, supaya tampilan stabil.
    views[day(d)] = 4 + ((i * 7) % 11) + (i % 7 === 0 ? 6 : 0);
  }

  const terima = (slug: string, n: number): Membership => ({
    slug,
    status: 'verified',
    proof: '@bagasdwiputra',
    reviewNote: null,
    joinedAt: iso(monthsAgo(now, n)),
  });

  return {
    version: 3,
    profile,
    journey,
    badges,
    memberships: [
      terima('aiesec', 5),
      terima('bisnis-muda', 5),
      terima('gensmart', 4),
      terima('isp', 4),
      terima('aico', 3),
    ],
    claims: [],
    projects: [
      {
        id: 'demo-pr1',
        userId: DEMO_USER_ID,
        title: 'Smart Investment Club',
        description: 'Komunitas investasi pertama di tingkat SMA dan bekerjasama dengan Sekuritas.',
        role: 'Founder',
        startedOn: day(monthsAgo(now, 5, 1)),
        endedOn: null,
        url: null,
        collaborators: 27,
        createdAt: iso(monthsAgo(now, 3, 21)),
      },
    ],
    certificates: [
      {
        id: 'demo-c1', userId: DEMO_USER_ID, source: 'self',
        title: '1st Winner US Stock Competition', issuer: 'Seeds Finance & Webull Sekuritas',
        issuedOn: day(monthsAgo(now, 3, 10)), credentialId: 'CSA-INV-2026-00123', credentialUrl: null,
        imagePath: null, isVerified: false, reviewNote: null, reviewedAt: null, createdAt: iso(monthsAgo(now, 3, 10)),
      },
      {
        id: 'demo-c2', userId: DEMO_USER_ID, source: 'self',
        title: 'Best of Badan Ekraf Digital Talent 2026', issuer: 'Kementerian Ekonomi Kreatif',
        issuedOn: day(monthsAgo(now, 5, 2)), credentialId: 'BEK-DT-2026-0417', credentialUrl: null,
        imagePath: null, isVerified: false, reviewNote: null, reviewedAt: null, createdAt: iso(monthsAgo(now, 5, 2)),
      },
      {
        id: 'demo-c3', userId: DEMO_USER_ID, source: 'catalyst',
        title: 'Investasi Untuk Pemula', issuer: 'Catalyst Academy',
        issuedOn: day(monthsAgo(now, 5, 18)), credentialId: 'CSA-INV-2026-00088', credentialUrl: null,
        imagePath: null, isVerified: true, reviewNote: null, reviewedAt: iso(monthsAgo(now, 5, 18)), createdAt: iso(monthsAgo(now, 5, 18)),
      },
    ],
    points,
    following: ['demo-p1', 'demo-p2', 'demo-p3', 'demo-p4', 'demo-p5'],
    followers: ['demo-p1', 'demo-p3', 'demo-p4', 'demo-p5', 'demo-p6'],
    views,
  };
}
