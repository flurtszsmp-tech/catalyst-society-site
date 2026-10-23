'use client';

/* ===========================================================
   Dashboard admin Catalyst.

   Hanya untuk akun info@catalystsociety.id. Halaman ini sekadar tampilan:
   setiap baris yang terbaca dan setiap pemeriksaan diputuskan database
   (public.is_staff, RLS, dan fungsi admin_* / staff_review_claim), jadi
   membuka alamat ini tanpa hak tidak memberi data apa pun.
   =========================================================== */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Dialog';
import { FormError, TextArea } from '@/components/ui/form';
import { BrandMark, Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { PersonAvatar } from '@/components/passport/sections/common';
import { Collaborations } from './Collaborations';
import { CHANNELS, findCommunity } from '@/lib/data/communities';
import { getRepo } from '@/lib/repo';
import { CLAIM_INFO, STAGE_RULES } from '@/lib/repo/journey-rules';
import {
  STAGES,
  type AdminAccount,
  type AdminActivity,
  type AdminUserDetail,
  type Collaboration,
  type Feedback,
  type FeedbackStatus,
  type Profile,
  type ReviewQueue,
  type Stage,
} from '@/lib/types';
import { safeHref } from '@/lib/url';

type Tab = 'ringkasan' | 'pengguna' | 'aktivitas' | 'verifikasi' | 'kolaborasi' | 'masukan';

interface Data {
  accounts: AdminAccount[];
  profiles: Profile[];
  activity: AdminActivity[];
  queue: ReviewQueue;
  feedback: Feedback[];
  collabs: Collaboration[];
}

const CHANNEL_LABEL = new Map<string, string>(CHANNELS.map((c) => [c.key, c.label.id]));
const angka = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);
const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const tgl = (s: string | null | undefined) =>
  s ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s)) : '—';
const waktu = (s: string | null | undefined) =>
  s ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(s)) : '—';
const hariLalu = (n: number) => Date.now() - n * 86400000;

const KIND_ICON: Record<string, string> = {
  daftar: 'user-plus',
  journey: 'journey',
  poin: 'bolt',
  projek: 'cube',
  sertifikat: 'award',
  komunitas: 'users',
  koneksi: 'network',
  pengajuan: 'shield-check',
  feedback: 'chat',
};
const KIND_LABEL: Record<string, string> = {
  daftar: 'Pendaftaran',
  journey: 'Journey',
  poin: 'Poin',
  projek: 'Projek',
  sertifikat: 'Sertifikat',
  komunitas: 'Komunitas',
  koneksi: 'Koneksi',
  pengajuan: 'Pengajuan',
  feedback: 'Masukan',
};

export function AdminApp() {
  const toast = useToast();
  const repo = useMemo(() => getRepo(), []);
  const [akses, setAkses] = useState<'muat' | 'tamu' | 'bukan' | 'ok'>('muat');
  const [email, setEmail] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('ringkasan');
  const [detail, setDetail] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setGalat(null);
    try {
      const [accounts, profiles, activity, queue, feedback, collabs] = await Promise.all([
        repo.adminAccounts(),
        repo.adminProfiles(),
        repo.adminActivity(500),
        repo.getReviewQueue(),
        repo.adminFeedback(),
        repo.adminCollaborations(),
      ]);
      setData({ accounts, profiles, activity, queue, feedback, collabs });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat data admin.');
    }
  }, [repo]);

  useEffect(() => {
    (async () => {
      const user = await repo.getSessionUser().catch(() => null);
      if (!user) {
        setAkses('tamu');
        location.replace(`/login?next=${encodeURIComponent('/admin/')}`);
        return;
      }
      setEmail(user.email);
      const staff = await repo.isStaff();
      setAkses(staff ? 'ok' : 'bukan');
      if (staff) void muat();
    })();
  }, [repo, muat]);

  const byId = useMemo(() => new Map((data?.profiles ?? []).map((p) => [p.id, p])), [data]);
  const akun = useMemo(() => new Map((data?.accounts ?? []).map((a) => [a.id, a])), [data]);

  async function keluar() {
    await repo.signOut().catch(() => {});
    location.href = '/';
  }

  if (akses !== 'ok') {
    return (
      <div className="adm-gate">
        <BrandMark className="adm-gate-mark" />
        {akses === 'muat' || akses === 'tamu' ? (
          <p>Memeriksa akses…</p>
        ) : (
          <>
            <h1>Khusus admin Catalyst</h1>
            <p>
              Dashboard ini hanya untuk akun admin Catalyst dengan email yang sudah terkonfirmasi.
              {email ? ` Anda masuk sebagai ${email}.` : ''}
            </p>
            <div className="adm-gate-act">
              <a className="ui-btn ui-btn-primary" href="/passport/">
                Buka Passport
              </a>
              <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void keluar()}>
                Keluar
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const menunggu = data?.queue.claims.length ?? 0;
  const masukanBaru = data?.feedback.filter((f) => f.status === 'baru').length ?? 0;
  const kolaborasiBaru = data?.collabs.filter((c) => c.status === 'baru').length ?? 0;
  const TABS: { key: Tab; label: string; icon: string; n?: number }[] = [
    { key: 'ringkasan', label: 'Ringkasan', icon: 'chart' },
    { key: 'pengguna', label: 'Pengguna', icon: 'users', n: data?.profiles.length },
    { key: 'aktivitas', label: 'Aktivitas', icon: 'journey' },
    { key: 'verifikasi', label: 'Verifikasi Journey', icon: 'shield-check', n: menunggu || undefined },
    { key: 'kolaborasi', label: 'Kolaborasi', icon: 'briefcase', n: kolaborasiBaru || undefined },
    { key: 'masukan', label: 'Masukan', icon: 'chat', n: masukanBaru || undefined },
  ];

  return (
    <div className="adm">
      <header className="adm-top">
        <a className="adm-brand" href="/" aria-label="Catalyst Society">
          <BrandMark />
          <span translate="no">
            <b>CATALYST</b>
            <small>ADMIN</small>
          </span>
        </a>
        <nav className="adm-tabs" aria-label="Bagian dashboard">
          {TABS.map((t) => (
            <button key={t.key} type="button" className={tab === t.key ? 'on' : ''} aria-current={tab === t.key ? 'page' : undefined} onClick={() => setTab(t.key)}>
              <Icon name={t.icon} />
              {t.label}
              {t.n !== undefined && <span className="adm-n">{angka(t.n)}</span>}
            </button>
          ))}
        </nav>
        <div className="adm-me">
          <button type="button" className="ui-icon-btn" onClick={() => void muat()} aria-label="Muat ulang data" title="Muat ulang">
            <Icon name="up" />
          </button>
          <span className="adm-email">{email}</span>
          <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" onClick={() => void keluar()}>
            <Icon name="logout" />
            Keluar
          </button>
        </div>
      </header>

      <main className="adm-main">
        {galat ? (
          <div className="ui-empty" role="alert">
            <b>Data tidak bisa dimuat</b>
            <p>{galat}</p>
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => void muat()}>
              Coba lagi
            </button>
          </div>
        ) : !data ? (
          <div className="adm-skel">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="ui-skeleton" />
            ))}
          </div>
        ) : tab === 'ringkasan' ? (
          <Ringkasan data={data} byId={byId} onOpen={setDetail} onTab={setTab} />
        ) : tab === 'pengguna' ? (
          <Pengguna data={data} akun={akun} onOpen={setDetail} />
        ) : tab === 'aktivitas' ? (
          <Aktivitas data={data} byId={byId} onOpen={setDetail} />
        ) : tab === 'verifikasi' ? (
          <Verifikasi
            data={data}
            onOpen={setDetail}
            onDone={(id) => setData((d) => (d ? { ...d, queue: { claims: d.queue.claims.filter((c) => c.claim.id !== id) } } : d))}
          />
        ) : tab === 'kolaborasi' ? (
          <Collaborations
            items={data.collabs}
            onUpdate={async (id, patch) => {
              try {
                await repo.adminUpdateCollaboration(id, patch);
                setData((d) =>
                  d
                    ? {
                        ...d,
                        collabs: d.collabs.map((c) =>
                          c.id === id ? { ...c, ...(patch.status ? { status: patch.status } : {}), ...(patch.adminNote !== undefined ? { adminNote: patch.adminNote?.trim() || null } : {}) } : c,
                        ),
                      }
                    : d,
                );
                toast('Tersimpan', 'ok');
                return true;
              } catch (e) {
                toast(e instanceof Error ? e.message : 'Gagal menyimpan.', 'error');
                return false;
              }
            }}
          />
        ) : (
          <Masukan
            data={data}
            byId={byId}
            onOpen={setDetail}
            onStatus={async (id, status) => {
              try {
                await repo.adminSetFeedbackStatus(id, status);
                setData((d) => (d ? { ...d, feedback: d.feedback.map((f) => (f.id === id ? { ...f, status } : f)) } : d));
              } catch (e) {
                toast(e instanceof Error ? e.message : 'Gagal menyimpan.', 'error');
              }
            }}
          />
        )}
      </main>

      {detail && <UserDetail id={detail} account={akun.get(detail) ?? null} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* ---------- ringkasan ---------- */

function Ringkasan({
  data,
  byId,
  onOpen,
  onTab,
}: {
  data: Data;
  byId: Map<string, Profile>;
  onOpen: (id: string) => void;
  onTab: (t: Tab) => void;
}) {
  const p = data.profiles;
  const baru7 = p.filter((x) => new Date(x.createdAt).getTime() >= hariLalu(7)).length;
  const baru30 = p.filter((x) => new Date(x.createdAt).getTime() >= hariLalu(30)).length;
  const aktif7 = data.accounts.filter((a) => a.lastSignInAt && new Date(a.lastSignInAt).getTime() >= hariLalu(7)).length;
  const rata = p.length ? Math.round(p.reduce((s, x) => s + x.cataPoints, 0) / p.length) : 0;
  const lengkap = p.filter((x) => (x.avatarPath || x.avatarUrl) && x.headline && x.about && x.skills.length >= 3).length;

  const perTahap = STAGES.map((s) => ({ key: s, label: STAGE_RULES[s].name, n: p.filter((x) => x.journeyStage === s).length }));
  const perKanal = [
    ...CHANNELS.map((c) => ({ key: c.key, label: c.label.id, n: p.filter((x) => x.channel === c.key).length })),
    { key: 'none', label: 'Belum memilih', n: p.filter((x) => !x.channel).length },
  ];

  // Pendaftaran per hari, 30 hari terakhir.
  const hari = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (29 - i));
    const k = d.toISOString().slice(0, 10);
    return { k, n: p.filter((x) => x.createdAt.slice(0, 10) === k).length, label: d };
  });
  const maksHari = Math.max(1, ...hari.map((h) => h.n));

  return (
    <div className="adm-stack">
      <ul className="adm-kpi">
        <Kpi icon="users" label="Total anggota" value={angka(p.length)} sub={`${angka(baru30)} dalam 30 hari`} />
        <Kpi icon="user-plus" label="Anggota baru 7 hari" value={angka(baru7)} />
        <Kpi icon="eye" label="Aktif 7 hari" value={angka(aktif7)} sub="Masuk dalam 7 hari terakhir" />
        <Kpi icon="bolt" label="Rata-rata poin CATA" value={angka(rata)} />
        <Kpi icon="user-check" label="Profil lengkap" value={`${p.length ? Math.round((lengkap / p.length) * 100) : 0}%`} sub={`${angka(lengkap)} anggota`} />
        <Kpi
          icon="shield-check"
          label="Pengajuan menunggu"
          value={angka(data.queue.claims.length)}
          action={data.queue.claims.length ? { label: 'Periksa', onClick: () => onTab('verifikasi') } : undefined}
        />
      </ul>

      <div className="adm-grid-2">
        <section className="ps2-card adm-card">
          <h2>Pendaftaran 30 hari terakhir</h2>
          <div className="adm-bars-v" role="img" aria-label={`Pendaftaran per hari: ${hari.map((h) => h.n).join(', ')}`}>
            {hari.map((h) => (
              <span key={h.k} title={`${tgl(h.k)}: ${h.n}`} style={{ height: `${(h.n / maksHari) * 100}%` }} className={h.n ? '' : 'nol'} />
            ))}
          </div>
          <div className="adm-bars-axis">
            <span>{tgl(hari[0].k)}</span>
            <span>Hari ini</span>
          </div>
        </section>
        <section className="ps2-card adm-card">
          <h2>Anggota per tahap Journey</h2>
          <Bars rows={perTahap} total={p.length} />
        </section>
      </div>

      <div className="adm-grid-2">
        <section className="ps2-card adm-card">
          <h2>Anggota per industri</h2>
          <Bars rows={perKanal} total={p.length} />
        </section>
        <section className="ps2-card adm-card">
          <div className="adm-card-head">
            <h2>Aktivitas terbaru</h2>
            <button type="button" className="ps2-link" onClick={() => onTab('aktivitas')}>
              Lihat semua
            </button>
          </div>
          <ActivityList items={data.activity.slice(0, 8)} byId={byId} onOpen={onOpen} />
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  action,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <li className="adm-kpi-item">
      <span className="adm-kpi-ico" aria-hidden>
        <Icon name={icon} />
      </span>
      <span className="adm-kpi-txt">
        <small>{label}</small>
        <b>{value}</b>
        {sub && <em>{sub}</em>}
      </span>
      {action && (
        <button type="button" className="ui-btn ui-btn-primary ps2-btn-sm" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </li>
  );
}

function Bars({ rows, total }: { rows: { key: string; label: string; n: number }[]; total: number }) {
  const maks = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ul className="adm-bars">
      {rows.map((r) => (
        <li key={r.key}>
          <span className="adm-bars-lbl">{r.label}</span>
          <span className="adm-bars-track">
            <i style={{ width: `${(r.n / maks) * 100}%` }} />
          </span>
          <span className="adm-bars-n">
            {angka(r.n)}
            <small>{total ? Math.round((r.n / total) * 100) : 0}%</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- pengguna ---------- */

function Pengguna({ data, akun, onOpen }: { data: Data; akun: Map<string, AdminAccount>; onOpen: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<Stage | ''>('');
  const [urut, setUrut] = useState<'baru' | 'poin' | 'aktif' | 'nama'>('baru');

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    let r = data.profiles.filter((p) => {
      if (stage && p.journeyStage !== stage) return false;
      if (!k) return true;
      const e = akun.get(p.id)?.email ?? '';
      return [p.fullName, p.catalystId, p.slug, p.headline ?? '', e].some((v) => v.toLowerCase().includes(k));
    });
    r = [...r].sort((a, b) => {
      if (urut === 'poin') return b.cataPoints - a.cataPoints;
      if (urut === 'nama') return a.fullName.localeCompare(b.fullName, 'id');
      if (urut === 'aktif') return (akun.get(b.id)?.lastSignInAt ?? '').localeCompare(akun.get(a.id)?.lastSignInAt ?? '');
      return b.createdAt.localeCompare(a.createdAt);
    });
    return r;
  }, [data.profiles, akun, q, stage, urut]);

  function ekspor() {
    const kolom = ['Catalyst ID', 'Nama', 'Email', 'Tahap', 'Poin', 'Industri', 'Headline', 'Lokasi', 'Publik', 'Daftar', 'Terakhir masuk'];
    const sel = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const isi = rows.map((p) => {
      const a = akun.get(p.id);
      return [
        p.catalystId,
        p.fullName,
        a?.email ?? '',
        STAGE_RULES[p.journeyStage].name,
        p.cataPoints,
        p.channel ? (CHANNEL_LABEL.get(p.channel) ?? p.channel) : '',
        p.headline ?? '',
        p.location ?? '',
        p.isPublic ? 'Ya' : 'Tidak',
        p.createdAt,
        a?.lastSignInAt ?? '',
      ]
        .map(sel)
        .join(',');
    });
    const blob = new Blob([`﻿${[kolom.map(sel).join(','), ...isi].join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `anggota-catalyst-${new Date().toISOString().slice(0, 10)}.csv`;
    el.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return (
    <section className="ps2-card adm-card">
      <div className="adm-toolbar">
        <div className="ps2-search">
          <Icon name="search" />
          <input className="ui-input" type="search" placeholder="Cari nama, email, Catalyst ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari pengguna" />
        </div>
        <select className="adm-select" value={stage} onChange={(e) => setStage(e.target.value as Stage | '')} aria-label="Saring tahap">
          <option value="">Semua tahap</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_RULES[s].name}
            </option>
          ))}
        </select>
        <select className="adm-select" value={urut} onChange={(e) => setUrut(e.target.value as typeof urut)} aria-label="Urutkan">
          <option value="baru">Terbaru daftar</option>
          <option value="aktif">Terakhir aktif</option>
          <option value="poin">Poin tertinggi</option>
          <option value="nama">Nama A–Z</option>
        </select>
        <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" onClick={ekspor}>
          <Icon name="download" />
          Ekspor CSV
        </button>
      </div>
      <p className="ps2-sub">{angka(rows.length)} anggota</p>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Anggota</th>
              <th>Email</th>
              <th>Tahap</th>
              <th className="num">Poin</th>
              <th>Industri</th>
              <th>Daftar</th>
              <th>Terakhir masuk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const a = akun.get(p.id);
              return (
                <tr key={p.id} onClick={() => onOpen(p.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(p.id)}>
                  <td>
                    <span className="adm-who">
                      <PersonAvatar person={{ ...p, journeyStage: p.journeyStage }} size={32} />
                      <span>
                        <b>
                          {p.fullName}
                          {!p.isPublic && <em className="adm-priv">privat</em>}
                        </b>
                        <small>{p.catalystId}</small>
                      </span>
                    </span>
                  </td>
                  <td className="adm-mail">
                    {a?.email ?? '—'}
                    {a && !a.emailConfirmed && <em className="adm-priv">belum konfirmasi</em>}
                  </td>
                  <td>{STAGE_RULES[p.journeyStage].name}</td>
                  <td className="num">{angka(p.cataPoints)}</td>
                  <td>{p.channel ? (CHANNEL_LABEL.get(p.channel) ?? p.channel) : '—'}</td>
                  <td>{tgl(p.createdAt)}</td>
                  <td>{waktu(a?.lastSignInAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- aktivitas ---------- */

function ActivityList({ items, byId, onOpen }: { items: AdminActivity[]; byId: Map<string, Profile>; onOpen: (id: string) => void }) {
  if (!items.length) return <p className="ps2-sub">Belum ada aktivitas.</p>;
  return (
    <ul className="adm-acts">
      {items.map((a, i) => {
        const p = a.userId ? byId.get(a.userId) : undefined;
        return (
          <li key={`${a.at}-${i}`}>
            <span className={`adm-act-ico k-${a.kind}`} aria-hidden>
              <Icon name={KIND_ICON[a.kind] ?? 'spark'} />
            </span>
            <span className="adm-act-txt">
              {p ? (
                <button type="button" className="adm-link" onClick={() => onOpen(p.id)}>
                  {p.fullName}
                </button>
              ) : (
                <b>Anggota terhapus</b>
              )}{' '}
              {a.detail}
              <small>
                {KIND_LABEL[a.kind] ?? a.kind} · {waktu(a.at)}
              </small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Aktivitas({ data, byId, onOpen }: { data: Data; byId: Map<string, Profile>; onOpen: (id: string) => void }) {
  const [jenis, setJenis] = useState<string>('semua');
  const [q, setQ] = useState('');
  const kinds = Object.keys(KIND_LABEL);
  const items = data.activity.filter((a) => {
    if (jenis !== 'semua' && a.kind !== jenis) return false;
    const k = q.trim().toLowerCase();
    if (!k) return true;
    const nama = a.userId ? (byId.get(a.userId)?.fullName ?? '') : '';
    return `${nama} ${a.detail}`.toLowerCase().includes(k);
  });
  return (
    <section className="ps2-card adm-card">
      <div className="adm-toolbar">
        <div className="ps2-search">
          <Icon name="search" />
          <input className="ui-input" type="search" placeholder="Cari nama atau aktivitas" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari aktivitas" />
        </div>
      </div>
      <div className="ps2-filters" role="group" aria-label="Jenis aktivitas">
        <button type="button" className="ps2-chip" aria-pressed={jenis === 'semua'} onClick={() => setJenis('semua')}>
          Semua
        </button>
        {kinds.map((k) => (
          <button key={k} type="button" className="ps2-chip" aria-pressed={jenis === k} onClick={() => setJenis(k)}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <p className="ps2-sub">{angka(items.length)} aktivitas, 500 terbaru</p>
      <ActivityList items={items} byId={byId} onOpen={onOpen} />
    </section>
  );
}

/* ---------- verifikasi journey ---------- */

function Verifikasi({ data, onOpen, onDone }: { data: Data; onOpen: (id: string) => void; onDone: (id: string) => void }) {
  const repo = useMemo(() => getRepo(), []);
  const toast = useToast();
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [tolak, setTolak] = useState<{ id: string; judul: string } | null>(null);

  async function putuskan(id: string, judul: string, setuju: boolean, catatan?: string) {
    setSibuk(id);
    try {
      await repo.reviewClaim(id, setuju, catatan);
      toast(`${judul}: ${setuju ? 'diterima' : 'ditolak'}.`);
      setTolak(null);
      onDone(id);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan pemeriksaan.', 'error');
    } finally {
      setSibuk(null);
    }
  }

  if (!data.queue.claims.length) {
    return (
      <section className="ps2-card adm-card">
        <div className="ui-empty">
          <b>Antrean kosong</b>
          <p>Tidak ada pengajuan tahap yang menunggu. Pengajuan Founder, bootcamp, Catalyst Finder, dan Catalyst Labs muncul di sini.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ps2-card adm-card">
      <h2>Pengajuan tahap Journey</h2>
      <ul className="adm-claims">
        {data.queue.claims.map(({ person, claim: c }) => {
          const href = safeHref(c.url);
          const judul = `${CLAIM_INFO[c.kind].title} ${person.fullName}`;
          return (
            <li key={c.id} className={c.kind === 'founder' ? 'is-founder' : undefined}>
              <button type="button" className="adm-who adm-who-btn" onClick={() => onOpen(person.id)}>
                <PersonAvatar person={person} size={40} />
                <span>
                  <b>{person.fullName}</b>
                  <small>Tahap kini: {STAGE_RULES[person.journeyStage]?.name}</small>
                </span>
              </button>
              <div className="adm-claim-body">
                <b>
                  {CLAIM_INFO[c.kind].title}
                  <span className="ps2-pill">untuk tahap {STAGE_RULES[CLAIM_INFO[c.kind].stage].name}</span>
                </b>
                <p>{c.detail}</p>
                {c.valuation ? <p className="adm-val">Valuasi: {rp(c.valuation)}</p> : null}
                <span className="adm-claim-meta">
                  Diajukan {waktu(c.createdAt)}
                  {href && (
                    <a className="ps2-link" href={href} target="_blank" rel="noopener noreferrer nofollow">
                      Buka bukti <Icon name="external" />
                    </a>
                  )}
                </span>
              </div>
              <div className="adm-claim-act">
                <button type="button" className="ui-btn ui-btn-primary ps2-btn-sm" disabled={sibuk !== null} onClick={() => void putuskan(c.id, judul, true)}>
                  <Icon name="check" />
                  {sibuk === c.id ? 'Menyimpan…' : 'Terima'}
                </button>
                <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" disabled={sibuk !== null} onClick={() => setTolak({ id: c.id, judul })}>
                  Tolak
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {tolak && (
        <RejectDialog judul={tolak.judul} busy={sibuk !== null} onClose={() => setTolak(null)} onConfirm={(n) => void putuskan(tolak.id, tolak.judul, false, n)} />
      )}
    </section>
  );
}

function RejectDialog({ judul, busy, onClose, onConfirm }: { judul: string; busy: boolean; onClose: () => void; onConfirm: (c: string) => void }) {
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  return (
    <Modal open onClose={onClose} title={`Tolak: ${judul}`} width={480} dismissible={!busy}>
      <form
        className="ui-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (catatan.trim().length < 5) return setGalat('Tulis alasan singkat supaya anggota tahu apa yang perlu diperbaiki.');
          onConfirm(catatan.trim());
        }}
      >
        <TextArea
          label="Alasan penolakan"
          hint="Tampil di Passport anggota. Contoh: bukti valuasi belum disertakan."
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          maxLength={300}
          counter
          rows={3}
          data-autofocus
        />
        <FormError message={galat} />
        <div className="ui-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="submit" className="ui-btn ui-btn-danger" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Tolak'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- masukan ---------- */

const FB_KIND: Record<string, string> = { saran: 'Saran', masalah: 'Masalah', pertanyaan: 'Pertanyaan', lainnya: 'Lainnya' };

function Masukan({
  data,
  byId,
  onOpen,
  onStatus,
}: {
  data: Data;
  byId: Map<string, Profile>;
  onOpen: (id: string) => void;
  onStatus: (id: number, s: FeedbackStatus) => Promise<void>;
}) {
  const [saring, setSaring] = useState<FeedbackStatus | 'semua'>('semua');
  const items = data.feedback.filter((f) => saring === 'semua' || f.status === saring);
  return (
    <section className="ps2-card adm-card">
      <div className="ps2-filters" role="group" aria-label="Status masukan">
        {(['semua', 'baru', 'dibaca', 'selesai'] as const).map((s) => (
          <button key={s} type="button" className="ps2-chip" aria-pressed={saring === s} onClick={() => setSaring(s)}>
            {s === 'semua' ? 'Semua' : s[0].toUpperCase() + s.slice(1)} ({angka(s === 'semua' ? data.feedback.length : data.feedback.filter((f) => f.status === s).length)})
          </button>
        ))}
      </div>
      {!items.length ? (
        <div className="ui-empty">
          <b>Belum ada masukan</b>
          <p>Anggota mengirim masukan lewat menu Kirim masukan di Passport.</p>
        </div>
      ) : (
        <ul className="adm-fb">
          {items.map((f) => {
            const p = f.userId ? byId.get(f.userId) : undefined;
            return (
              <li key={f.id} className={`is-${f.status}`}>
                <div className="adm-fb-head">
                  <span className={`adm-fb-kind k-${f.kind}`}>{FB_KIND[f.kind] ?? f.kind}</span>
                  {p ? (
                    <button type="button" className="adm-link" onClick={() => onOpen(p.id)}>
                      {p.fullName}
                    </button>
                  ) : (
                    <b>Anggota terhapus</b>
                  )}
                  <small>
                    {waktu(f.createdAt)}
                    {f.page ? ` · ${f.page}` : ''}
                  </small>
                  <select className="adm-select" value={f.status} onChange={(e) => void onStatus(f.id, e.target.value as FeedbackStatus)} aria-label="Status masukan">
                    <option value="baru">Baru</option>
                    <option value="dibaca">Dibaca</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
                <p>{f.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------- detail pengguna ---------- */

function UserDetail({ id, account, onClose }: { id: string; account: AdminAccount | null; onClose: () => void }) {
  const repo = useMemo(() => getRepo(), []);
  const [d, setD] = useState<AdminUserDetail | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let hidup = true;
    repo.adminUserDetail(id).then(
      (x) => hidup && setD(x),
      (e: unknown) => hidup && setGalat(e instanceof Error ? e.message : 'Gagal memuat detail.'),
    );
    return () => {
      hidup = false;
    };
  }, [repo, id]);

  const p = d?.bundle.profile;
  return (
    <Modal open onClose={onClose} title={p?.fullName ?? 'Detail anggota'} width={820}>
      {galat ? (
        <p className="ui-error">{galat}</p>
      ) : !d || !p ? (
        <div className="adm-skel">
          <div className="ui-skeleton" />
          <div className="ui-skeleton" />
        </div>
      ) : (
        <div className="adm-detail">
          <div className="adm-detail-top">
            <PersonAvatar person={{ ...p }} size={64} />
            <div>
              <b>
                {p.fullName} <span className="ps2-pill">{p.catalystId}</span>
                {!p.isPublic && <em className="adm-priv">profil privat</em>}
              </b>
              <p>{p.headline || 'Belum ada headline'}</p>
              <small>
                {account?.email ?? '—'} · masuk lewat {account?.provider ?? 'email'} · daftar {tgl(p.createdAt)} · terakhir masuk{' '}
                {waktu(account?.lastSignInAt)}
              </small>
            </div>
            <a className="ui-btn ui-btn-ghost ps2-btn-sm" href={`/pass/${encodeURIComponent(p.slug)}`} target="_blank" rel="noopener noreferrer">
              Profil publik <Icon name="external" />
            </a>
          </div>

          <ul className="adm-mini">
            <li>
              <small>Tahap</small>
              <b>{STAGE_RULES[p.journeyStage].name}</b>
            </li>
            <li>
              <small>Poin CATA</small>
              <b>{angka(p.cataPoints)}</b>
            </li>
            <li>
              <small>Pengikut</small>
              <b>{angka(d.bundle.followers)}</b>
            </li>
            <li>
              <small>Mengikuti</small>
              <b>{angka(d.bundle.following)}</b>
            </li>
            <li>
              <small>Kunjungan 30 hari</small>
              <b>{angka(d.views30d)}</b>
            </li>
            <li>
              <small>Lencana</small>
              <b>{angka(d.bundle.badges.length)}</b>
            </li>
          </ul>

          <div className="adm-grid-2">
            <section>
              <h3>Profil</h3>
              <dl className="adm-dl">
                <dt>Industri</dt>
                <dd>{p.channel ? (CHANNEL_LABEL.get(p.channel) ?? p.channel) : '—'}</dd>
                <dt>Lokasi</dt>
                <dd>{p.location || '—'}</dd>
                <dt>Skills</dt>
                <dd>{p.skills.join(', ') || '—'}</dd>
                <dt>Roles</dt>
                <dd>{p.roles.join(', ') || '—'}</dd>
                <dt>CV</dt>
                <dd>
                  {d.cvLink ? (
                    <a className="ps2-link" href={safeHref(d.cvLink) ?? '#'} target="_blank" rel="noopener noreferrer">
                      Tautan CV
                    </a>
                  ) : p.cvFileName ? (
                    `${p.cvFileName} (${p.cvVisibility === 'public' ? 'publik' : 'privat'})`
                  ) : (
                    '—'
                  )}
                </dd>
              </dl>
              {p.about && <p className="adm-about">{p.about}</p>}
            </section>
            <section>
              <h3>Journey</h3>
              <ol className="adm-journey">
                {d.bundle.journey.map((j) => (
                  <li key={j.stage}>
                    <b>{j.title}</b> <small>{tgl(j.occurredAt)}</small>
                  </li>
                ))}
              </ol>
              {d.claims.length > 0 && (
                <>
                  <h3>Pengajuan</h3>
                  <ul className="adm-plain">
                    {d.claims.map((c) => (
                      <li key={c.id}>
                        {CLAIM_INFO[c.kind].title} · <em>{c.status}</em> · {tgl(c.createdAt)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>

          <div className="adm-grid-2">
            <section>
              <h3>Komunitas ({d.bundle.communities.length})</h3>
              <p className="adm-chips">
                {d.bundle.communities.length
                  ? d.bundle.communities.map((s) => <span key={s}>{findCommunity(s)?.name ?? s}</span>)
                  : '—'}
              </p>
              <h3>Projek ({d.bundle.projects.length})</h3>
              <ul className="adm-plain">
                {d.bundle.projects.map((x) => (
                  <li key={x.id}>
                    {x.title}
                    {x.role ? ` · ${x.role}` : ''}
                  </li>
                ))}
                {!d.bundle.projects.length && <li>—</li>}
              </ul>
              <h3>Sertifikat ({d.bundle.certificates.length})</h3>
              <ul className="adm-plain">
                {d.bundle.certificates.map((c) => (
                  <li key={c.id}>
                    {c.title} · {c.issuer} {c.isVerified ? <em className="adm-ok">terverifikasi</em> : <em>belum terverifikasi</em>}
                  </li>
                ))}
                {!d.bundle.certificates.length && <li>—</li>}
              </ul>
            </section>
            <section>
              <h3>Riwayat poin</h3>
              <ul className="adm-plain">
                {[...d.points].reverse().map((x, i) => (
                  <li key={`${x.reason}-${i}`}>
                    {x.reason} <b>{x.delta >= 0 ? `+${x.delta}` : x.delta}</b> <small>{tgl(x.createdAt)}</small>
                  </li>
                ))}
                {!d.points.length && <li>—</li>}
              </ul>
              {d.feedback.length > 0 && (
                <>
                  <h3>Masukan</h3>
                  <ul className="adm-plain">
                    {d.feedback.map((f) => (
                      <li key={f.id}>
                        {f.message} <small>{tgl(f.createdAt)}</small>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </Modal>
  );
}
