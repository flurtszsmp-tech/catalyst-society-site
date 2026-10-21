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
  JourneyEvent,
  PointEvent,
  Profile,
  ProfileSummary,
  Project,
} from '@/lib/types';

export const DEMO_USER_ID = 'demo';
export const DEMO_SLUG = 'cat-27da21';

export const BADGE_CATALOG: Badge[] = [
  { code: 'first_step', name: 'First Step', description: 'Membuat Catalyst Passport', icon: 'spark' },
  { code: 'first_community', name: 'First Community', description: 'Bergabung ke komunitas pertama', icon: 'users' },
  { code: 'community_explorer', name: 'Community Explorer', description: 'Bergabung ke lima komunitas', icon: 'search' },
  { code: 'ecosystem_native', name: 'Ecosystem Native', description: 'Aktif di tiga channel industri', icon: 'globe' },
  { code: 'first_project', name: 'First Project', description: 'Menambahkan projek pertama', icon: 'rocket' },
  { code: 'certified', name: 'Certified', description: 'Memiliki sertifikat terverifikasi', icon: 'badge' },
  { code: 'builder', name: 'Builder', description: 'Mencapai tahap Builder pada Journey', icon: 'cube' },
];

export interface DemoState {
  version: 2;
  profile: Profile;
  journey: JourneyEvent[];
  badges: EarnedBadge[];
  communities: string[];
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
  { id: 'demo-p1', slug: 'cat-a1b2c3', fullName: 'Nadia Pratiwi', headline: 'Product Designer', avatarPath: null, avatarUrl: null, isVerified: true, journeyStage: 'contributor' },
  { id: 'demo-p2', slug: 'cat-d4e5f6', fullName: 'Raka Aditya', headline: 'Full Stack Developer', avatarPath: null, avatarUrl: null, isVerified: false, journeyStage: 'builder' },
  { id: 'demo-p3', slug: 'cat-778899', fullName: 'Sinta Maharani', headline: 'Investment Analyst', avatarPath: null, avatarUrl: null, isVerified: true, journeyStage: 'challenger' },
  { id: 'demo-p4', slug: 'cat-aa11bb', fullName: 'Dimas Saputra', headline: 'AI Engineer', avatarPath: null, avatarUrl: null, isVerified: false, journeyStage: 'connector' },
  { id: 'demo-p5', slug: 'cat-cc22dd', fullName: 'Ayu Lestari', headline: 'Community Lead', avatarPath: null, avatarUrl: null, isVerified: true, journeyStage: 'builder' },
  { id: 'demo-p6', slug: 'cat-ee33ff', fullName: 'Fajar Nugroho', headline: 'Founder, Fintech Startup', avatarPath: null, avatarUrl: null, isVerified: false, journeyStage: 'innovator' },
];

export function buildDemoSeed(now = new Date()): DemoState {
  const joined = monthsAgo(now, 5);

  const profile: Profile = {
    id: DEMO_USER_ID,
    catalystId: 'CAT-27DA21',
    slug: DEMO_SLUG,
    fullName: 'Bagas Dwi Putra',
    headline: 'Founder of Catalyst Society',
    location: 'Jakarta Selatan, Indonesia',
    about:
      'Founder Catalyst Society, ekosistem yang menghubungkan, menginspirasi, dan mempercepat pertumbuhan builders, innovators, investors, dan changemakers untuk menciptakan dampak positif bagi Indonesia dan dunia.',
    avatarPath: null,
    avatarUrl: null,
    channel: 'business',
    journeyStage: 'builder',
    cataPoints: 1270,
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
    { stage: 'connector', title: 'Connector', detail: 'Bergabung ke tiga komunitas', occurredAt: iso(monthsAgo(now, 4, 8)) },
    { stage: 'builder', title: 'Builder', detail: 'Membuat projek pertama', occurredAt: iso(monthsAgo(now, 3, 21)) },
  ];

  const badges: EarnedBadge[] = BADGE_CATALOG.map((b, i) => ({
    ...b,
    earnedAt: iso(monthsAgo(now, Math.max(0, 5 - i))),
  }));

  // Enam bulan, ditutup dengan total yang sama dengan profile.cataPoints.
  const totals = [620, 700, 845, 960, 1150, 1270];
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

  return {
    version: 2,
    profile,
    journey,
    badges,
    communities: ['aiesec', 'bbka', 'bisnis-muda', 'blockplay', 'crypto-legal', 'gensmart', 'isp', 'kompaschain', 'mekari', 'yli', 'yot'],
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
        imagePath: null, isVerified: false, createdAt: iso(monthsAgo(now, 3, 10)),
      },
      {
        id: 'demo-c2', userId: DEMO_USER_ID, source: 'self',
        title: 'Best of Badan Ekraf Digital Talent 2026', issuer: 'Kementerian Ekonomi Kreatif',
        issuedOn: day(monthsAgo(now, 5, 2)), credentialId: 'BEK-DT-2026-0417', credentialUrl: null,
        imagePath: null, isVerified: false, createdAt: iso(monthsAgo(now, 5, 2)),
      },
      {
        id: 'demo-c3', userId: DEMO_USER_ID, source: 'catalyst',
        title: 'Investasi Untuk Pemula', issuer: 'Catalyst Academy',
        issuedOn: day(monthsAgo(now, 5, 18)), credentialId: 'CSA-INV-2026-00088', credentialUrl: null,
        imagePath: null, isVerified: true, createdAt: iso(monthsAgo(now, 5, 18)),
      },
    ],
    points,
    following: ['demo-p1', 'demo-p2', 'demo-p3', 'demo-p5'],
    followers: ['demo-p1', 'demo-p3', 'demo-p4', 'demo-p5', 'demo-p6'],
    views,
  };
}
