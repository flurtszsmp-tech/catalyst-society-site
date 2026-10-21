'use client';

/* ===========================================================
   DemoRepo — seluruh Passport di localStorage, tanpa server.

   Aturan hadiahnya meniru private.award() di SQL persis: tiap alasan
   hanya sekali, tahap journey hanya naik, dan lencana Certified tidak
   diberikan untuk sertifikat yang ditambahkan sendiri. Dengan begitu
   mode demo berperilaku sama dengan produksi, bukan versi yang lebih
   murah hati.
   =========================================================== */
import { BADGE_CATALOG, DEMO_USER_ID, SAMPLE_PEOPLE, buildDemoSeed, type DemoState } from '@/lib/data/demo-seed';
import {
  STAGES,
  type Certificate,
  type CertificateInput,
  type DailyCount,
  type Profile,
  type ProfilePatch,
  type ProfileSummary,
  type Project,
  type ProjectInput,
  type Stage,
} from '@/lib/types';
import { safeHref } from '@/lib/url';
import { LIMITS, RepoError, SLUG_PATTERN, assertFile, cvDisplayName, type PassportRepo } from './types';

const KEY = 'catalyst-passport-demo-v2';

function load(): DemoState {
  const seed = buildDemoSeed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Partial<DemoState>;
    if (saved.version !== 2 || !saved.profile) return seed;
    // Gabung per bidang profil, supaya bidang baru dari seed tidak hilang
    // tertimpa objek lama yang tersimpan.
    return { ...seed, ...saved, profile: { ...seed.profile, ...saved.profile } } as DemoState;
  } catch {
    return seed;
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Perkecil gambar lalu simpan sebagai data URL JPEG, supaya localStorage tidak penuh. */
async function shrinkImage(file: File, max: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const skala = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * skala);
  const h = Math.round(bitmap.height * skala);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new RepoError('Browser ini tidak bisa memproses gambar.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.86);
}

export class DemoRepo implements PassportRepo {
  readonly mode = 'demo' as const;
  private s: DemoState = load();
  /** CV demo hanya hidup selama tab terbuka; PDF terlalu besar untuk localStorage. */
  private cvObjectUrl: string | null = null;

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.s));
    } catch {
      throw new RepoError('Penyimpanan browser penuh. Hapus gambar besar lalu coba lagi.');
    }
  }

  private award(reason: string, delta: number, badge?: string, stage?: Stage, title?: string, detail?: string): void {
    if (this.s.points.some((p) => p.reason === reason)) return;
    const now = new Date().toISOString();
    this.s.points.push({ delta, reason, createdAt: now });
    this.s.profile.cataPoints += delta;
    if (badge && !this.s.badges.some((b) => b.code === badge)) {
      const b = BADGE_CATALOG.find((x) => x.code === badge);
      if (b) this.s.badges.push({ ...b, earnedAt: now });
    }
    if (stage) {
      if (!this.s.journey.some((j) => j.stage === stage)) {
        this.s.journey.push({ stage, title: title ?? stage, detail: detail ?? null, occurredAt: now });
      }
      if (STAGES.indexOf(stage) > STAGES.indexOf(this.s.profile.journeyStage)) {
        this.s.profile.journeyStage = stage;
      }
    }
  }

  private checkProfileComplete(): void {
    const p = this.s.profile;
    if ((p.avatarPath || p.avatarUrl) && p.headline?.trim() && p.about?.trim() && p.skills.length >= 3) {
      this.award('profile_complete', 30);
    }
  }

  private mine(userId: string): boolean {
    return userId === DEMO_USER_ID;
  }

  // ---------- sesi ----------
  async getSessionUser() {
    return { id: DEMO_USER_ID, email: 'demo@catalystsociety.id', provider: 'demo' };
  }
  async signOut() {
    // Mode demo tidak punya sesi sungguhan; cukup kembali ke beranda.
  }

  // ---------- profil ----------
  async getMyProfile() {
    return structuredClone(this.s.profile);
  }

  async updateMyProfile(patch: ProfilePatch): Promise<Profile> {
    if (patch.slug !== undefined && !SLUG_PATTERN.test(patch.slug)) {
      throw new RepoError('Alamat profil hanya boleh huruf kecil, angka, dan tanda hubung (3–40 karakter).');
    }
    if (patch.fullName !== undefined && !patch.fullName.trim()) {
      throw new RepoError('Nama tidak boleh kosong.');
    }
    if (patch.links) {
      for (const [k, v] of Object.entries(patch.links)) {
        if (v && !safeHref(v)) throw new RepoError(`Tautan ${k} tidak valid. Gunakan alamat http:// atau https://.`);
      }
    }
    this.s.profile = { ...this.s.profile, ...patch, updatedAt: new Date().toISOString() };
    this.checkProfileComplete();
    this.save();
    return structuredClone(this.s.profile);
  }

  async isSlugAvailable(slug: string) {
    return slug === this.s.profile.slug || !SAMPLE_PEOPLE.some((p) => p.slug === slug);
  }

  async uploadAvatar(file: File) {
    assertFile(file, LIMITS.avatarTypes, LIMITS.avatarBytes, 'Foto profil');
    this.s.profile.avatarPath = await shrinkImage(file, 320);
    this.checkProfileComplete();
    this.save();
    return structuredClone(this.s.profile);
  }

  async removeAvatar() {
    this.s.profile.avatarPath = null;
    this.save();
    return structuredClone(this.s.profile);
  }

  async uploadCv(file: File) {
    assertFile(file, LIMITS.cvTypes, LIMITS.cvBytes, 'CV');
    if (this.cvObjectUrl) URL.revokeObjectURL(this.cvObjectUrl);
    this.cvObjectUrl = URL.createObjectURL(file);
    this.s.profile.cvFileName = cvDisplayName(file.name);
    this.save();
    return structuredClone(this.s.profile);
  }

  async removeCv() {
    if (this.cvObjectUrl) URL.revokeObjectURL(this.cvObjectUrl);
    this.cvObjectUrl = null;
    this.s.profile.cvFileName = null;
    this.save();
    return structuredClone(this.s.profile);
  }

  async getCvUrl() {
    return this.cvObjectUrl;
  }

  // ---------- capaian ----------
  async listJourney(userId: string) {
    return this.mine(userId) ? structuredClone(this.s.journey) : [];
  }
  async listEarnedBadges(userId: string) {
    return this.mine(userId) ? structuredClone(this.s.badges) : [];
  }
  async listAllBadges() {
    return structuredClone(BADGE_CATALOG);
  }
  async listMyPointEvents() {
    return structuredClone(this.s.points);
  }

  // ---------- komunitas ----------
  async listCommunities(userId: string) {
    return this.mine(userId) ? [...this.s.communities] : [];
  }

  async joinCommunity(slug: string) {
    if (this.s.communities.includes(slug)) return;
    this.s.communities.push(slug);
    const n = this.s.communities.length;
    if (n >= 1) this.award('first_community', 20, 'first_community');
    if (n >= 3) this.award('connector', 30, undefined, 'connector', 'Connector', 'Bergabung ke tiga komunitas');
    if (n >= 5) this.award('community_explorer', 20, 'community_explorer');
    this.save();
  }

  async leaveCommunity(slug: string) {
    this.s.communities = this.s.communities.filter((c) => c !== slug);
    this.save();
  }

  // ---------- projek ----------
  private checkProject(input: ProjectInput): void {
    if (!input.title.trim()) throw new RepoError('Judul projek wajib diisi.');
    if (input.url && !safeHref(input.url)) throw new RepoError('Tautan projek harus diawali http:// atau https://.');
    if (input.startedOn && input.endedOn && input.endedOn < input.startedOn) {
      throw new RepoError('Tanggal selesai tidak boleh sebelum tanggal mulai.');
    }
  }

  async listProjects(userId: string) {
    return this.mine(userId) ? structuredClone(this.s.projects) : [];
  }

  async createProject(input: ProjectInput): Promise<Project> {
    this.checkProject(input);
    if (this.s.projects.length >= 50) throw new RepoError('Batas 50 projek per profil tercapai.');
    const p: Project = { ...input, id: uid('pr'), userId: DEMO_USER_ID, createdAt: new Date().toISOString() };
    this.s.projects.push(p);
    this.award('first_project', 50, 'first_project', 'builder', 'Builder', 'Membuat projek pertama');
    this.award('builder_badge', 0, 'builder');
    this.save();
    return structuredClone(p);
  }

  async updateProject(id: string, input: ProjectInput) {
    this.checkProject(input);
    const i = this.s.projects.findIndex((p) => p.id === id);
    if (i < 0) throw new RepoError('Projek tidak ditemukan.');
    this.s.projects[i] = { ...this.s.projects[i], ...input };
    this.save();
    return structuredClone(this.s.projects[i]);
  }

  async deleteProject(id: string) {
    this.s.projects = this.s.projects.filter((p) => p.id !== id);
    this.save();
  }

  // ---------- sertifikat ----------
  private checkCert(input: CertificateInput): void {
    if (!input.title.trim()) throw new RepoError('Judul sertifikat wajib diisi.');
    if (!input.issuer.trim()) throw new RepoError('Penerbit sertifikat wajib diisi.');
    if (input.credentialUrl && !safeHref(input.credentialUrl)) {
      throw new RepoError('Tautan kredensial harus diawali http:// atau https://.');
    }
  }

  async listCertificates(userId: string) {
    return this.mine(userId) ? structuredClone(this.s.certificates) : [];
  }

  async createCertificate(input: CertificateInput, image?: File | null): Promise<Certificate> {
    this.checkCert(input);
    if (this.s.certificates.length >= 100) throw new RepoError('Batas 100 sertifikat per profil tercapai.');
    let imagePath: string | null = null;
    if (image) {
      assertFile(image, LIMITS.certTypes, LIMITS.certBytes, 'Gambar sertifikat');
      imagePath = await shrinkImage(image, 900);
    }
    const c: Certificate = {
      ...input,
      id: uid('ce'),
      userId: DEMO_USER_ID,
      source: 'self',
      imagePath,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    this.s.certificates.push(c);
    this.save();
    return structuredClone(c);
  }

  async updateCertificate(id: string, input: CertificateInput, image?: File | null) {
    this.checkCert(input);
    const i = this.s.certificates.findIndex((c) => c.id === id);
    if (i < 0) throw new RepoError('Sertifikat tidak ditemukan.');
    const cur = this.s.certificates[i];
    if (cur.source !== 'self') throw new RepoError('Sertifikat terbitan Catalyst tidak bisa diubah.');
    let imagePath = cur.imagePath;
    if (image === null) imagePath = null;
    else if (image) {
      assertFile(image, LIMITS.certTypes, LIMITS.certBytes, 'Gambar sertifikat');
      imagePath = await shrinkImage(image, 900);
    }
    this.s.certificates[i] = { ...cur, ...input, imagePath };
    this.save();
    return structuredClone(this.s.certificates[i]);
  }

  async deleteCertificate(id: string) {
    const cur = this.s.certificates.find((c) => c.id === id);
    if (cur && cur.source !== 'self') throw new RepoError('Sertifikat terbitan Catalyst tidak bisa dihapus.');
    this.s.certificates = this.s.certificates.filter((c) => c.id !== id);
    this.save();
  }

  // ---------- koneksi ----------
  private people(ids: string[]): ProfileSummary[] {
    return ids.map((id) => SAMPLE_PEOPLE.find((p) => p.id === id)).filter((p): p is ProfileSummary => !!p);
  }
  async listFollowing(userId: string) {
    return this.mine(userId) ? this.people(this.s.following) : [];
  }
  async listFollowers(userId: string) {
    return this.mine(userId) ? this.people(this.s.followers) : [];
  }
  async countConnections(userId: string) {
    return this.mine(userId)
      ? { followers: this.s.followers.length, following: this.s.following.length }
      : { followers: 0, following: 0 };
  }
  async follow(profileId: string) {
    if (profileId === DEMO_USER_ID) throw new RepoError('Anda tidak bisa mengikuti diri sendiri.');
    if (!this.s.following.includes(profileId)) this.s.following.push(profileId);
    this.save();
  }
  async unfollow(profileId: string) {
    this.s.following = this.s.following.filter((id) => id !== profileId);
    this.save();
  }
  async searchProfiles(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [...SAMPLE_PEOPLE];
    return SAMPLE_PEOPLE.filter(
      (p) => p.fullName.toLowerCase().includes(q) || (p.headline ?? '').toLowerCase().includes(q),
    );
  }

  // ---------- analitik ----------
  async getProfileViews(days: number): Promise<DailyCount[]> {
    const out: DailyCount[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      out.push({ date: k, count: this.s.views[k] ?? 0 });
    }
    return out;
  }

  async recordProfileView() {
    // Demo tidak mencatat kunjungan; grafiknya memakai data contoh.
  }

  async getPublicBundle(slug: string) {
    if (slug.toLowerCase() !== this.s.profile.slug.toLowerCase()) return null;
    const s = structuredClone(this.s);
    return { profile: s.profile, journey: s.journey, badges: s.badges, communities: s.communities, projects: s.projects,
      certificates: s.certificates, followers: s.followers.length, following: s.following.length };
  }

  // ---------- akun ----------
  async updatePassword(newPassword: string) {
    if (newPassword.length < 8) throw new RepoError('Kata sandi minimal 8 karakter.');
    // Mode demo tidak punya akun sungguhan; tidak ada yang disimpan.
  }

  async deleteMyAccount() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    this.s = buildDemoSeed();
  }
}
