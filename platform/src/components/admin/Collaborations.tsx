'use client';

/* ===========================================================
   Tab Kolaborasi di dashboard admin: permintaan dari formulir
   catalystsociety.id/#kolaborasi. Admin menyaring, membuka detail,
   menghubungi lewat email atau WhatsApp, lalu mencatat tindak lanjut.
   =========================================================== */
import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Dialog';
import { TextArea } from '@/components/ui/form';
import { Icon } from '@/components/ui/Icon';
import type { Collaboration, CollaborationStatus } from '@/lib/types';
import { safeHref } from '@/lib/url';

export const COLLAB_STATUS: { key: CollaborationStatus; label: string }[] = [
  { key: 'baru', label: 'Baru' },
  { key: 'ditinjau', label: 'Ditinjau' },
  { key: 'dihubungi', label: 'Dihubungi' },
  { key: 'berjalan', label: 'Berjalan' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'ditolak', label: 'Ditolak' },
];
const LABEL = new Map(COLLAB_STATUS.map((s) => [s.key, s.label]));
const INDUSTRI: Record<string, string> = { business: 'Business', investments: 'Investments', ai: 'AI & Technology', builder: 'Builders', impact: 'Social Impact' };

const angka = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);
const waktu = (s: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

/** Nomor Indonesia ke format wa.me: 08xx -> 628xx. Null bila bukan nomor. */
function waNumber(phone: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) d = `62${d.slice(1)}`;
  return d.length >= 9 && d.length <= 15 ? d : null;
}

export function Collaborations({
  items,
  onUpdate,
}: {
  items: Collaboration[];
  onUpdate: (id: string, patch: { status?: CollaborationStatus; adminNote?: string | null }) => Promise<boolean>;
}) {
  const [saring, setSaring] = useState<CollaborationStatus | 'semua'>('semua');
  const [cari, setCari] = useState('');
  const [buka, setBuka] = useState<string | null>(null);
  // Waktu acuan sekali per pemasangan, supaya hitungan 7 hari tidak berubah tiap render.
  const [sekarang] = useState(() => Date.now());

  const hitung = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of items) m.set(c.status, (m.get(c.status) ?? 0) + 1);
    return m;
  }, [items]);

  const q = cari.trim().toLowerCase();
  const tampil = items.filter(
    (c) =>
      (saring === 'semua' || c.status === saring) &&
      (!q || [c.refNo, c.fullName, c.email, c.organization ?? '', c.kinds.join(' '), c.message].join(' ').toLowerCase().includes(q)),
  );
  const detail = buka ? items.find((c) => c.id === buka) : undefined;
  const minggu = items.filter((c) => sekarang - new Date(c.createdAt).getTime() < 7 * 86400000).length;

  return (
    <section className="ps2-card adm-card">
      <div className="adm-kol-kpi">
        <div>
          <b>{angka(items.length)}</b>
          <span>Total permintaan</span>
        </div>
        <div>
          <b>{angka(hitung.get('baru') ?? 0)}</b>
          <span>Belum ditinjau</span>
        </div>
        <div>
          <b>{angka(minggu)}</b>
          <span>7 hari terakhir</span>
        </div>
        <div>
          <b>{angka((hitung.get('berjalan') ?? 0) + (hitung.get('selesai') ?? 0))}</b>
          <span>Berjalan atau selesai</span>
        </div>
      </div>

      <div className="adm-toolbar">
        <div className="ps2-search">
          <Icon name="search" />
          <label htmlFor="adm-kol-q" className="sr-only">
            Cari permintaan kolaborasi
          </label>
          <input
            id="adm-kol-q"
            type="search"
            className="ui-input"
            placeholder="Cari nama, organisasi, nomor referensi…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
      </div>
      <div className="ps2-filters" role="group" aria-label="Status kolaborasi">
        <button type="button" className="ps2-chip" aria-pressed={saring === 'semua'} onClick={() => setSaring('semua')}>
          Semua ({angka(items.length)})
        </button>
        {COLLAB_STATUS.map((s) => (
          <button key={s.key} type="button" className="ps2-chip" aria-pressed={saring === s.key} onClick={() => setSaring(s.key)}>
            {s.label} ({angka(hitung.get(s.key) ?? 0)})
          </button>
        ))}
      </div>

      {!tampil.length ? (
        <div className="ui-empty">
          <b>{items.length ? 'Tidak ada yang cocok' : 'Belum ada permintaan kolaborasi'}</b>
          <p>Permintaan masuk dari formulir Open Collaboration di catalystsociety.id.</p>
        </div>
      ) : (
        <ul className="adm-kol">
          {tampil.map((c) => (
            <li key={c.id} className={`is-${c.status}`}>
              <button type="button" className="adm-kol-row" onClick={() => setBuka(c.id)}>
                <span className="adm-kol-main">
                  <span className="adm-kol-ref">{c.refNo}</span>
                  <b>{c.organization || c.fullName}</b>
                  <small>
                    {c.fullName}
                    {c.jobTitle ? ` · ${c.jobTitle}` : ''}
                    {c.orgType ? ` · ${c.orgType}` : ''}
                  </small>
                </span>
                <span className="adm-kol-tags">
                  {c.kinds.slice(0, 3).map((k) => (
                    <em key={k}>{k}</em>
                  ))}
                  {c.kinds.length > 3 && <em>+{c.kinds.length - 3}</em>}
                </span>
                <span className="adm-kol-meta">
                  <span className={`adm-kol-st s-${c.status}`}>{LABEL.get(c.status)}</span>
                  <small>{waktu(c.createdAt)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {detail && <CollabDetail c={detail} onClose={() => setBuka(null)} onUpdate={onUpdate} />}
    </section>
  );
}

function CollabDetail({
  c,
  onClose,
  onUpdate,
}: {
  c: Collaboration;
  onClose: () => void;
  onUpdate: (id: string, patch: { status?: CollaborationStatus; adminNote?: string | null }) => Promise<boolean>;
}) {
  const [catatan, setCatatan] = useState(c.adminNote ?? '');
  const [sibuk, setSibuk] = useState(false);
  const wa = waNumber(c.phone);
  const situs = c.website ? safeHref(/^https?:\/\//i.test(c.website) ? c.website : `https://${c.website}`) : null;
  const subjek = encodeURIComponent(`Kolaborasi Catalyst Society · ${c.refNo}`);
  const sapa = encodeURIComponent(`Halo ${c.fullName}, terima kasih sudah mengajukan kolaborasi dengan Catalyst Society (${c.refNo}). `);

  const baris: [string, string | null][] = [
    ['Nama', c.fullName],
    ['Jabatan', c.jobTitle],
    ['Organisasi', c.organization],
    ['Jenis organisasi', c.orgType],
    ['Email', c.email],
    ['Telepon / WhatsApp', c.phone],
    ['Situs / LinkedIn', c.website],
    ['Industri', c.industries.map((i) => INDUSTRI[i] ?? i).join(', ') || null],
    ['Perkiraan nilai', c.budget],
    ['Target waktu', c.timeline],
    ['Dihubungi lewat', c.contactPref],
    ['Mengetahui dari', c.source],
    ['Dikirim', waktu(c.createdAt)],
  ];

  async function simpan(patch: { status?: CollaborationStatus; adminNote?: string | null }) {
    setSibuk(true);
    await onUpdate(c.id, patch);
    setSibuk(false);
  }

  return (
    <Modal open onClose={onClose} title={`${c.refNo} · ${c.organization || c.fullName}`} width={640}>
      <div className="adm-kol-detail">
        <div className="adm-kol-kinds">
          {c.kinds.map((k) => (
            <em key={k}>{k}</em>
          ))}
        </div>
        <blockquote>{c.message}</blockquote>
        <dl>
          {baris
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{k === 'Situs / LinkedIn' && situs ? <a href={situs} target="_blank" rel="noopener noreferrer">{v}</a> : v}</dd>
              </div>
            ))}
        </dl>

        <div className="adm-kol-act">
          <a className="ui-btn ui-btn-primary" href={`mailto:${c.email}?subject=${subjek}&body=${sapa}`}>
            <Icon name="mail" />
            Balas email
          </a>
          {wa && (
            <a className="ui-btn ui-btn-ghost" href={`https://wa.me/${wa}?text=${sapa}`} target="_blank" rel="noopener noreferrer">
              <Icon name="wa" />
              WhatsApp
            </a>
          )}
          <label className="adm-kol-status">
            <span>Status</span>
            <select className="adm-select" value={c.status} disabled={sibuk} onChange={(e) => void simpan({ status: e.target.value as CollaborationStatus })}>
              {COLLAB_STATUS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form
          className="ui-form"
          onSubmit={(e) => {
            e.preventDefault();
            void simpan({ adminNote: catatan });
          }}
        >
          <TextArea
            label="Catatan internal"
            hint="Hanya terlihat oleh admin. Contoh: sudah telepon, jadwal meeting Senin 10.00."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            maxLength={2000}
            counter
            rows={3}
          />
          <div className="ui-actions">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
              Tutup
            </button>
            <button type="submit" className="ui-btn ui-btn-primary" disabled={sibuk || catatan === (c.adminNote ?? '')}>
              {sibuk ? 'Menyimpan…' : 'Simpan catatan'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
