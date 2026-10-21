'use client';

/* ===========================================================
   SupabaseRepo — data sungguhan.

   Keamanan tidak diputuskan di sini. Setiap baris dijaga RLS dan hak
   kolom di supabase/migrations/0001_init.sql; berkas ini hanya
   menerjemahkan antara camelCase aplikasi dan snake_case database,
   dan mengirim HANYA kolom yang memang diberi hak tulis. Mengirim kolom
   lain (misalnya cata_points) akan ditolak database, bukan diabaikan.
   =========================================================== */
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase/client';
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
  PassportBundle,
  Project,
  ProjectInput,
  ReviewQueue,
  SessionUser,
  Stage,
} from '@/lib/types';
import {
  CLAIM_COLS,
  MEMBERSHIP_COLS,
  PROFILE_COLS,
  SUMMARY_COLS,
  toCertificate,
  toClaim,
  toJourney,
  toMembership,
  toProfile,
  toProject,
  toSummary,
} from './mappers';
import { LIMITS, RepoError, SLUG_PATTERN, assertFile, cvDisplayName, type PassportRepo } from './types';

type Row = Record<string, unknown>;

/* ---------- pesan galat ----------
   Galat Postgres diterjemahkan ke kalimat yang bisa dipahami pengguna.
   Pesan asli tetap ikut di .cause untuk debugging. */
function fail(e: PostgrestError | Error | null | unknown, fallback: string): never {
  const err = e as Partial<PostgrestError> & { message?: string };
  const code = err?.code;
  let msg = fallback;
  if (code === '23505') msg = 'Data itu sudah dipakai. Coba nilai lain.';
  else if (code === '23514') msg = err.message?.startsWith('Batas') ? err.message : 'Isian tidak memenuhi aturan. Periksa panjang teks dan format tautan.';
  else if (code === '42501') msg = err.message?.startsWith('Hanya tim') ? err.message : 'Anda tidak punya izin untuk tindakan ini.';
  else if (code === 'P0002' && err.message) msg = err.message;
  else if (code === 'PGRST301' || code === '401') msg = 'Sesi Anda habis. Silakan masuk lagi.';
  else if (err?.message && /fetch|network/i.test(err.message)) msg = 'Tidak bisa terhubung ke server. Periksa koneksi internet.';
  throw new RepoError(msg, e);
}

function ext(file: File): string {
  const m: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  return m[file.type] ?? 'bin';
}

function stamp(): string {
  return Date.now().toString(36);
}

export class SupabaseRepo implements PassportRepo {
  readonly mode = 'supabase' as const;
  private db: SupabaseClient;

  constructor(db?: SupabaseClient) {
    const c = db ?? getBrowserSupabase();
    if (!c) throw new RepoError('Supabase belum dikonfigurasi.');
    this.db = c;
  }

  /** id pengguna yang sedang masuk, atau galat bila sesi habis. */
  private async me(): Promise<string> {
    const { data, error } = await this.db.auth.getUser();
    if (error || !data.user) throw new RepoError('Sesi Anda habis. Silakan masuk lagi.', error);
    return data.user.id;
  }

  // ---------- sesi ----------
  async getSessionUser(): Promise<SessionUser | null> {
    const { data, error } = await this.db.auth.getUser();
    // Hanya "tidak ada sesi" yang berarti tamu. Galat jaringan dilempar,
    // supaya gangguan sesaat tidak mengeluarkan pengguna ke /login.
    if (error && error.name !== 'AuthSessionMissingError' && error.status !== 401 && error.status !== 403) {
      throw new RepoError('Tidak bisa memeriksa sesi. Periksa koneksi Anda.', error);
    }
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email ?? null,
      provider: (data.user.app_metadata?.provider as string | undefined) ?? 'email',
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.db.auth.signOut();
    if (error) fail(error, 'Gagal keluar. Coba lagi.');
  }

  // ---------- profil ----------
  async getMyProfile(): Promise<Profile | null> {
    const id = await this.me();
    const { data, error } = await this.db.from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle();
    if (error) fail(error, 'Gagal memuat profil.');
    return data ? toProfile(data) : null;
  }

  async updateMyProfile(patch: ProfilePatch): Promise<Profile> {
    const id = await this.me();
    if (patch.slug !== undefined && !SLUG_PATTERN.test(patch.slug)) {
      throw new RepoError('Alamat profil hanya boleh huruf kecil, angka, dan tanda hubung (3–40 karakter).');
    }
    const row: Row = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName.trim();
    if (patch.headline !== undefined) row.headline = patch.headline?.trim() || null;
    if (patch.location !== undefined) row.location = patch.location?.trim() || null;
    if (patch.about !== undefined) row.about = patch.about?.trim() || null;
    if (patch.channel !== undefined) row.channel = patch.channel;
    if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
    if (patch.links !== undefined) {
      // Kanal kosong dibuang supaya tidak tersimpan sebagai string kosong.
      row.links = Object.fromEntries(Object.entries(patch.links).filter(([, v]) => !!v));
    }
    if (patch.skills !== undefined) row.skills = patch.skills;
    if (patch.roles !== undefined) row.roles = patch.roles;
    if (patch.cvVisibility !== undefined) row.cv_visibility = patch.cvVisibility;
    if (patch.slug !== undefined) row.slug = patch.slug;

    const { data, error } = await this.db.from('profiles').update(row).eq('id', id).select(PROFILE_COLS).single();
    if (error) {
      if (error.code === '23505') throw new RepoError('Alamat profil itu sudah dipakai orang lain.', error);
      fail(error, 'Gagal menyimpan profil.');
    }
    return toProfile(data);
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    if (!SLUG_PATTERN.test(slug)) return false;
    const id = await this.me();
    // Profil privat tidak terbaca orang lain, jadi pengecekan ini bisa
    // mengatakan "tersedia" untuk slug milik profil privat. Penyimpanan
    // tetap aman: constraint unique di database yang memutuskan.
    const { data, error } = await this.db.from('profiles').select('id').eq('slug', slug).maybeSingle();
    if (error) fail(error, 'Gagal memeriksa alamat profil.');
    return !data || data.id === id;
  }

  async uploadAvatar(file: File): Promise<Profile> {
    assertFile(file, LIMITS.avatarTypes, LIMITS.avatarBytes, 'Foto profil');
    const id = await this.me();
    const lama = (await this.getMyProfile())?.avatarPath ?? null;
    // Nama berkas berganti tiap unggah supaya cache CDN tidak menyajikan foto lama.
    const path = `${id}/avatar-${stamp()}.${ext(file)}`;
    const up = await this.db.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) fail(up.error, 'Gagal mengunggah foto.');
    const profil = await this.setColumn('avatar_path', path);
    if (lama && lama !== path) await this.db.storage.from('avatars').remove([lama]);
    return profil;
  }

  async removeAvatar(): Promise<Profile> {
    const lama = (await this.getMyProfile())?.avatarPath ?? null;
    const profil = await this.setColumn('avatar_path', null);
    if (lama) await this.db.storage.from('avatars').remove([lama]);
    return profil;
  }

  async uploadCv(file: File): Promise<Profile> {
    assertFile(file, LIMITS.cvTypes, LIMITS.cvBytes, 'CV');
    const id = await this.me();
    const up = await this.db.storage
      .from('cvs')
      .upload(`${id}/cv.pdf`, file, { contentType: 'application/pdf', upsert: true });
    if (up.error) fail(up.error, 'Gagal mengunggah CV.');
    return this.setColumn('cv_file_name', cvDisplayName(file.name));
  }

  async removeCv(): Promise<Profile> {
    const id = await this.me();
    const { error } = await this.db.storage.from('cvs').remove([`${id}/cv.pdf`]);
    if (error) fail(error, 'Gagal menghapus CV.');
    return this.setColumn('cv_file_name', null);
  }

  async getCvUrl(profile: Pick<Profile, 'id' | 'cvFileName'>): Promise<string | null> {
    if (!profile.cvFileName) return null;
    // Bucket cvs privat. Tautan bertanda tangan berlaku 10 menit; RLS
    // storage yang memutuskan apakah peminta boleh membacanya.
    // Nama unduhan dibersihkan dan selalu berakhiran .pdf. cv_file_name
    // diisi pemilik profil; tanpa ini pengunjung bisa menerima berkas
    // bernama "CV.hta" atau "CV.exe" dari domain yang mereka percaya.
    const nama =
      profile.cvFileName
        .replace(/\.pdf$/i, '')
        .replace(/[^A-Za-z0-9 ._-]+/g, '')
        .replace(/^[.\s]+|[.\s]+$/g, '')
        .slice(0, 80) || 'CV';
    const { data, error } = await this.db.storage.from('cvs').createSignedUrl(`${profile.id}/cv.pdf`, 600, {
      download: `${nama}.pdf`,
    });
    if (error) return null;
    return data.signedUrl;
  }

  private async setColumn(col: 'avatar_path' | 'cv_file_name', value: string | null): Promise<Profile> {
    const id = await this.me();
    const { data, error } = await this.db
      .from('profiles')
      .update({ [col]: value })
      .eq('id', id)
      .select(PROFILE_COLS)
      .single();
    if (error) fail(error, 'Gagal menyimpan profil.');
    return toProfile(data);
  }

  // ---------- capaian ----------
  async listJourney(userId: string): Promise<JourneyEvent[]> {
    const { data, error } = await this.db
      .from('journey_events')
      .select('stage, title, detail, occurred_at')
      .eq('user_id', userId)
      .order('occurred_at');
    if (error) fail(error, 'Gagal memuat journey.');
    return (data ?? []).map(toJourney);
  }

  async listEarnedBadges(userId: string): Promise<EarnedBadge[]> {
    const { data, error } = await this.db
      .from('user_badges')
      .select('earned_at, badges(code, name, description, icon)')
      .eq('user_id', userId)
      .order('earned_at');
    if (error) fail(error, 'Gagal memuat lencana.');
    return (data ?? []).flatMap((r: Row) => {
      const b = r.badges as Row | null;
      return b
        ? [{ code: b.code as string, name: b.name as string, description: (b.description as string) ?? null, icon: b.icon as string, earnedAt: r.earned_at as string }]
        : [];
    });
  }

  async listAllBadges(): Promise<Badge[]> {
    const { data, error } = await this.db.from('badges').select('code, name, description, icon');
    if (error) fail(error, 'Gagal memuat katalog lencana.');
    return (data ?? []) as Badge[];
  }

  async listMyPointEvents(): Promise<PointEvent[]> {
    const id = await this.me();
    const { data, error } = await this.db
      .from('point_events')
      .select('delta, reason, created_at')
      .eq('user_id', id)
      .order('created_at');
    if (error) fail(error, 'Gagal memuat riwayat poin.');
    return (data ?? []).map((r: Row) => ({ delta: r.delta as number, reason: r.reason as string, createdAt: r.created_at as string }));
  }

  async getJourneyProgress(): Promise<JourneyProgress> {
    const id = await this.me();
    const hitung = (t: string, kolom: string, extra?: [string, string]) => {
      let r = this.db.from(t).select('*', { count: 'exact', head: true }).eq(kolom, id);
      if (extra) r = r.eq(extra[0], extra[1]);
      return r;
    };
    const [kom, tunggu, ikut, cert, proj, claims] = await Promise.all([
      hitung('community_members', 'user_id', ['status', 'verified']),
      hitung('community_members', 'user_id', ['status', 'pending']),
      hitung('connections', 'follower_id'),
      hitung('certificates', 'user_id'),
      hitung('projects', 'user_id'),
      this.listMyClaims(),
    ]);
    const salah = [kom, tunggu, ikut, cert, proj].find((r) => r.error)?.error;
    if (salah) fail(salah, 'Gagal memuat kemajuan journey.');
    return {
      verifiedCommunities: kom.count ?? 0,
      pendingCommunities: tunggu.count ?? 0,
      following: ikut.count ?? 0,
      certificates: cert.count ?? 0,
      projects: proj.count ?? 0,
      claims,
    };
  }

  async listMyClaims(): Promise<JourneyClaim[]> {
    const id = await this.me();
    const { data, error } = await this.db
      .from('journey_claims')
      .select(CLAIM_COLS)
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    if (error) fail(error, 'Gagal memuat pengajuan tahap.');
    return (data ?? []).map(toClaim);
  }

  async submitClaim(input: ClaimInput): Promise<JourneyClaim> {
    const row: Row = {
      kind: input.kind,
      detail: input.detail.trim(),
      url: input.url?.trim() || null,
      valuation: input.kind === 'founder' ? input.valuation : null,
    };
    const { data, error } = await this.db.from('journey_claims').insert(row).select(CLAIM_COLS).single();
    if (error) {
      if (error.code === '23505') throw new RepoError('Pengajuan untuk tahap ini masih diperiksa atau sudah diterima.', error);
      if (error.code === '23514') {
        throw new RepoError(
          input.kind === 'founder'
            ? 'Valuasi bisnis harus di atas Rp100.000.000, dan keterangan minimal 10 karakter.'
            : 'Keterangan minimal 10 karakter dan tautan harus diawali http:// atau https://.',
          error,
        );
      }
      fail(error, 'Gagal mengirim pengajuan.');
    }
    return toClaim(data);
  }

  async cancelClaim(id: string): Promise<void> {
    const { error } = await this.db.from('journey_claims').delete().eq('id', id).eq('status', 'pending');
    if (error) fail(error, 'Gagal membatalkan pengajuan.');
  }

  async markJourneySeen(stage: Stage): Promise<void> {
    const id = await this.me();
    const { error } = await this.db.from('profiles').update({ journey_seen_stage: stage }).eq('id', id);
    if (error) fail(error, 'Gagal menyimpan.');
  }

  // ---------- komunitas ----------
  async listCommunities(userId: string): Promise<string[]> {
    // Disaring eksplisit: pemilik juga boleh membaca keanggotaan yang masih
    // menunggu, tetapi kartu profil hanya menampilkan yang sudah diterima.
    const { data, error } = await this.db
      .from('community_members')
      .select('community_slug')
      .eq('user_id', userId)
      .eq('status', 'verified');
    if (error) fail(error, 'Gagal memuat komunitas.');
    return (data ?? []).map((r: Row) => r.community_slug as string);
  }

  async listMyMemberships(): Promise<Membership[]> {
    const id = await this.me();
    const { data, error } = await this.db
      .from('community_members')
      .select(MEMBERSHIP_COLS)
      .eq('user_id', id)
      .order('joined_at', { ascending: false });
    if (error) fail(error, 'Gagal memuat komunitas.');
    return (data ?? []).map(toMembership);
  }

  async joinCommunity(slug: string, proof: string): Promise<void> {
    const bukti = proof.trim().slice(0, 300);
    if (bukti.length < 3) throw new RepoError('Isi bukti keanggotaan, misalnya username atau tautan profil Anda di komunitas itu.');
    const { error } = await this.db.from('community_members').insert({ community_slug: slug, proof: bukti });
    if (error && error.code !== '23505') fail(error, 'Gagal mengajukan keanggotaan.');
  }

  async updateMembershipProof(slug: string, proof: string): Promise<void> {
    const id = await this.me();
    const bukti = proof.trim().slice(0, 300);
    if (bukti.length < 3) throw new RepoError('Bukti keanggotaan minimal 3 karakter.');
    const { error } = await this.db
      .from('community_members')
      .update({ proof: bukti })
      .eq('user_id', id)
      .eq('community_slug', slug);
    if (error) fail(error, 'Gagal menyimpan bukti.');
  }

  async leaveCommunity(slug: string): Promise<void> {
    const id = await this.me();
    const { error } = await this.db.from('community_members').delete().eq('user_id', id).eq('community_slug', slug);
    if (error) fail(error, 'Gagal keluar dari komunitas.');
  }

  // ---------- projek ----------
  private projectRow(i: ProjectInput): Row {
    return {
      title: i.title.trim(),
      description: i.description?.trim() || null,
      role: i.role?.trim() || null,
      started_on: i.startedOn || null,
      ended_on: i.endedOn || null,
      url: i.url?.trim() || null,
      collaborators: Math.max(0, Math.floor(i.collaborators || 0)),
    };
  }

  async listProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.db
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('started_on', { ascending: false, nullsFirst: false });
    if (error) fail(error, 'Gagal memuat projek.');
    return (data ?? []).map(toProject);
  }

  async createProject(input: ProjectInput): Promise<Project> {
    const { data, error } = await this.db.from('projects').insert(this.projectRow(input)).select('*').single();
    if (error) fail(error, 'Gagal menambah projek.');
    return toProject(data);
  }

  async updateProject(id: string, input: ProjectInput): Promise<Project> {
    const { data, error } = await this.db.from('projects').update(this.projectRow(input)).eq('id', id).select('*').single();
    if (error) fail(error, 'Gagal menyimpan projek.');
    return toProject(data);
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this.db.from('projects').delete().eq('id', id);
    if (error) fail(error, 'Gagal menghapus projek.');
  }

  // ---------- sertifikat ----------
  private certRow(i: CertificateInput): Row {
    return {
      title: i.title.trim(),
      issuer: i.issuer.trim(),
      issued_on: i.issuedOn || null,
      credential_id: i.credentialId?.trim() || null,
      credential_url: i.credentialUrl?.trim() || null,
    };
  }

  private async uploadCertImage(file: File): Promise<string> {
    assertFile(file, LIMITS.certTypes, LIMITS.certBytes, 'Gambar sertifikat');
    const id = await this.me();
    const path = `${id}/${stamp()}-${Math.random().toString(36).slice(2, 8)}.${ext(file)}`;
    const up = await this.db.storage.from('certificates').upload(path, file, { contentType: file.type });
    if (up.error) fail(up.error, 'Gagal mengunggah gambar sertifikat.');
    return path;
  }

  async listCertificates(userId: string): Promise<Certificate[]> {
    const { data, error } = await this.db
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issued_on', { ascending: false, nullsFirst: false });
    if (error) fail(error, 'Gagal memuat sertifikat.');
    return (data ?? []).map(toCertificate);
  }

  async createCertificate(input: CertificateInput, image?: File | null): Promise<Certificate> {
    const row = this.certRow(input);
    if (image) row.image_path = await this.uploadCertImage(image);
    const { data, error } = await this.db.from('certificates').insert(row).select('*').single();
    if (error) {
      if (row.image_path) await this.db.storage.from('certificates').remove([row.image_path as string]);
      fail(error, 'Gagal menambah sertifikat.');
    }
    return toCertificate(data);
  }

  async updateCertificate(id: string, input: CertificateInput, image?: File | null): Promise<Certificate> {
    const { data: cur } = await this.db.from('certificates').select('image_path').eq('id', id).maybeSingle();
    const lama = (cur?.image_path as string | null) ?? null;
    const row = this.certRow(input);
    if (image === null) row.image_path = null;
    else if (image) row.image_path = await this.uploadCertImage(image);

    const { data, error } = await this.db.from('certificates').update(row).eq('id', id).select('*').single();
    if (error) {
      if (image && row.image_path) await this.db.storage.from('certificates').remove([row.image_path as string]);
      fail(error, 'Gagal menyimpan sertifikat.');
    }
    if (image !== undefined && lama && lama !== row.image_path) {
      await this.db.storage.from('certificates').remove([lama]);
    }
    return toCertificate(data);
  }

  async deleteCertificate(id: string): Promise<void> {
    const { data: cur } = await this.db.from('certificates').select('image_path').eq('id', id).maybeSingle();
    const { error } = await this.db.from('certificates').delete().eq('id', id);
    if (error) fail(error, 'Gagal menghapus sertifikat.');
    if (cur?.image_path) await this.db.storage.from('certificates').remove([cur.image_path as string]);
  }

  // ---------- koneksi ----------
  async listFollowing(userId: string): Promise<ProfileSummary[]> {
    const { data, error } = await this.db
      .from('connections')
      .select(`profiles!connections_following_id_fkey(${SUMMARY_COLS})`)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });
    if (error) fail(error, 'Gagal memuat koneksi.');
    return (data ?? []).flatMap((r: Row) => (r.profiles ? [toSummary(r.profiles as Row)] : []));
  }

  async listFollowers(userId: string): Promise<ProfileSummary[]> {
    const { data, error } = await this.db
      .from('connections')
      .select(`profiles!connections_follower_id_fkey(${SUMMARY_COLS})`)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });
    if (error) fail(error, 'Gagal memuat pengikut.');
    return (data ?? []).flatMap((r: Row) => (r.profiles ? [toSummary(r.profiles as Row)] : []));
  }

  async countConnections(userId: string) {
    const [a, b] = await Promise.all([
      this.db.from('connections').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      this.db.from('connections').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return { followers: a.count ?? 0, following: b.count ?? 0 };
  }

  async follow(profileId: string): Promise<void> {
    const { error } = await this.db.from('connections').insert({ following_id: profileId });
    if (error && error.code !== '23505') fail(error, 'Gagal mengikuti profil ini.');
  }

  async unfollow(profileId: string): Promise<void> {
    const id = await this.me();
    const { error } = await this.db.from('connections').delete().eq('follower_id', id).eq('following_id', profileId);
    if (error) fail(error, 'Gagal berhenti mengikuti.');
  }

  async searchProfiles(query: string): Promise<ProfileSummary[]> {
    const id = await this.me();
    // Tanda % dan _ di-escape supaya tidak menjadi wildcard, dan koma
    // serta tanda kurung dibuang karena memecah sintaks filter or().
    const q = query.trim().slice(0, 60).replace(/[%_\\]/g, (m) => `\\${m}`).replace(/[,()]/g, ' ');
    let req = this.db.from('profiles').select(SUMMARY_COLS).eq('is_public', true).neq('id', id).limit(24);
    if (q) req = req.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%`);
    const { data, error } = await req.order('cata_points', { ascending: false });
    if (error) fail(error, 'Gagal mencari profil.');
    return (data ?? []).map(toSummary);
  }

  async searchPeople(f: PeopleFilter): Promise<ProfileSummary[]> {
    const id = await this.me();
    const saya = await this.getMyProfile();
    const q = f.query.trim().slice(0, 60).replace(/[%_\\]/g, (m) => `\\${m}`).replace(/[,()]/g, ' ');

    let req = this.db.from('profiles').select(SUMMARY_COLS).eq('is_public', true).neq('id', id).limit(48);
    if (q) req = req.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%`);
    if (f.channel) req = req.eq('channel', f.channel);
    if (f.stage) req = req.eq('journey_stage', f.stage);
    // Saringan "serupa" tanpa isian sendiri tidak berarti apa-apa; daftar
    // kosong lebih jujur daripada diam-diam mengabaikan saringannya.
    if (f.sameSkills) {
      if (!saya?.skills.length) return [];
      req = req.overlaps('skills', saya.skills);
    }
    if (f.sameRoles) {
      if (!saya?.roles.length) return [];
      req = req.overlaps('roles', saya.roles);
    }
    if (f.sameBadges) {
      const mine = await this.listEarnedBadges(id);
      if (!mine.length) return [];
      const { data: rows, error } = await this.db
        .from('user_badges')
        .select('user_id')
        .in('badge_code', mine.map((b) => b.code))
        .neq('user_id', id)
        .limit(1000);
      if (error) fail(error, 'Gagal mencari profil.');
      const ids = [...new Set((rows ?? []).map((r: Row) => r.user_id as string))];
      if (!ids.length) return [];
      req = req.in('id', ids.slice(0, 300));
    }
    if (f.hideFollowing) {
      const { data: ikut, error } = await this.db.from('connections').select('following_id').eq('follower_id', id);
      if (error) fail(error, 'Gagal mencari profil.');
      const ids = (ikut ?? []).map((r: Row) => r.following_id as string);
      if (ids.length) req = req.not('id', 'in', `(${ids.join(',')})`);
    }
    req =
      f.sort === 'newest'
        ? req.order('created_at', { ascending: false })
        : req.order('cata_points', { ascending: f.sort === 'points_asc' });
    const { data, error } = await req;
    if (error) fail(error, 'Gagal mencari profil.');
    return (data ?? []).map(toSummary);
  }

  // ---------- tim Catalyst ----------
  async isStaff(): Promise<boolean> {
    const { data, error } = await this.db.rpc('is_staff');
    if (error) return false;
    return data === true;
  }

  async getReviewQueue(): Promise<ReviewQueue> {
    const orang = `profiles(${SUMMARY_COLS})`;
    const [m, c, k] = await Promise.all([
      this.db
        .from('community_members')
        .select(`user_id, ${MEMBERSHIP_COLS}, ${orang}`)
        .eq('status', 'pending')
        .order('joined_at')
        .limit(200),
      this.db
        .from('certificates')
        .select(`*, ${orang}`)
        .eq('is_verified', false)
        .eq('source', 'self')
        .is('reviewed_at', null)
        .order('created_at')
        .limit(200),
      this.db
        .from('journey_claims')
        .select(`user_id, ${CLAIM_COLS}, ${orang}`)
        .eq('status', 'pending')
        .order('created_at')
        .limit(200),
    ]);
    const salah = m.error ?? c.error ?? k.error;
    if (salah) fail(salah, 'Gagal memuat antrean pemeriksaan.');
    const orangDari = (r: Row) => (r.profiles ? toSummary(r.profiles as Row) : null);
    const baris = (d: unknown) => (d ?? []) as Row[];
    return {
      memberships: baris(m.data).flatMap((r) => {
        const person = orangDari(r);
        return person ? [{ person, membership: toMembership(r) }] : [];
      }),
      certificates: baris(c.data).flatMap((r) => {
        const person = orangDari(r);
        return person ? [{ person, certificate: toCertificate(r) }] : [];
      }),
      claims: baris(k.data).flatMap((r) => {
        const person = orangDari(r);
        return person ? [{ person, claim: toClaim(r) }] : [];
      }),
    };
  }

  async reviewMembership(userId: string, slug: string, approve: boolean, note?: string): Promise<void> {
    const { error } = await this.db.rpc('staff_review_membership', {
      p_user: userId,
      p_slug: slug,
      p_approve: approve,
      p_note: note ?? null,
    });
    if (error) fail(error, 'Gagal menyimpan pemeriksaan.');
  }

  async reviewCertificate(id: string, approve: boolean, note?: string): Promise<void> {
    const { error } = await this.db.rpc('staff_review_certificate', { p_id: id, p_approve: approve, p_note: note ?? null });
    if (error) fail(error, 'Gagal menyimpan pemeriksaan.');
  }

  async reviewClaim(id: string, approve: boolean, note?: string): Promise<void> {
    const { error } = await this.db.rpc('staff_review_claim', { p_id: id, p_approve: approve, p_note: note ?? null });
    if (error) fail(error, 'Gagal menyimpan pemeriksaan.');
  }

  // ---------- analitik ----------
  async getProfileViews(days: number): Promise<DailyCount[]> {
    const id = await this.me();
    const dari = new Date();
    dari.setDate(dari.getDate() - (days - 1));
    const { data, error } = await this.db
      .from('profile_views')
      .select('viewed_on')
      .eq('profile_id', id)
      .gte('viewed_on', dari.toISOString().slice(0, 10));
    if (error) fail(error, 'Gagal memuat analitik.');
    const hitung: Record<string, number> = {};
    for (const r of data ?? []) hitung[r.viewed_on as string] = (hitung[r.viewed_on as string] ?? 0) + 1;
    const out: DailyCount[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(dari);
      d.setDate(dari.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      out.push({ date: k, count: hitung[k] ?? 0 });
    }
    return out;
  }

  async getPublicBundle(slug: string): Promise<PassportBundle | null> {
    const { data: row } = await this.db.from('profiles').select(PROFILE_COLS).eq('slug', slug.toLowerCase()).maybeSingle();
    if (!row) return null;
    const profile = toProfile(row as Row);
    const [journey, badges, communities, projects, certificates, c] = await Promise.all([
      this.listJourney(profile.id), this.listEarnedBadges(profile.id), this.listCommunities(profile.id),
      this.listProjects(profile.id), this.listCertificates(profile.id), this.countConnections(profile.id),
    ]);
    return { profile, journey, badges, communities, projects, certificates, followers: c.followers, following: c.following };
  }

  async recordProfileView(slug: string): Promise<void> {
    try {
      await this.db.rpc('record_profile_view', { p_slug: slug });
    } catch {
      // Hitungan kunjungan bukan hal penting; kegagalannya tidak boleh
      // mengganggu orang yang sedang membuka profil.
    }
  }

  // ---------- akun ----------
  async updatePassword(newPassword: string): Promise<void> {
    if (newPassword.length < 8) throw new RepoError('Kata sandi minimal 8 karakter.');
    const { error } = await this.db.auth.updateUser({ password: newPassword });
    if (error) {
      if (/same/i.test(error.message)) throw new RepoError('Kata sandi baru harus berbeda dari yang lama.', error);
      if (/weak|short|characters/i.test(error.message)) throw new RepoError('Kata sandi terlalu lemah. Pakai minimal 8 karakter campuran.', error);
      fail(error, 'Gagal mengganti kata sandi.');
    }
  }

  async deleteMyAccount(): Promise<void> {
    const id = await this.me();
    // Berkas dihapus lewat API storage lebih dulu. Baris storage.objects
    // tidak ikut terhapus oleh cascade dan tidak boleh dihapus lewat SQL.
    for (const bucket of ['avatars', 'certificates', 'cvs'] as const) {
      const { data } = await this.db.storage.from(bucket).list(id, { limit: 1000 });
      const paths = (data ?? []).map((f) => `${id}/${f.name}`);
      if (paths.length) await this.db.storage.from(bucket).remove(paths);
    }
    const { error } = await this.db.rpc('delete_my_account');
    if (error) fail(error, 'Gagal menghapus akun.');
    await this.db.auth.signOut();
  }
}
