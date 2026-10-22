'use client';

/* ===========================================================
   Panel panel Home.

   Home dibuat ulang supaya satu layar menjawab dua pertanyaan pertama
   pemiliknya: siapa saya di Catalyst, dan apa langkah berikutnya.
   Sembilan kartu lama dipadatkan jadi tujuh panel kecil yang melayang di
   atas kanvas abu, hitam hanya dipakai untuk kartu Passport dan satu
   tombol utama, dan ikon hanya dipakai di tempat yang memang lebih cepat
   dikenali lewat gambar: empat aksi cepat dan kartu identitas.
   =========================================================== */

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { STAGE_RULES } from '@/lib/repo/journey-rules';
import { STAGES, type Certificate, type EarnedBadge, type PointEvent, type Profile, type Project } from '@/lib/types';
import { Avatar } from '../cards/Avatar';
import { CopyButton } from '../cards/CopyButton';
import { angka, pointsSeries, stageIndex, stageName } from '../cards/format';

/* ---------- kartu identitas ---------- */

export function IdentityPanel({ profile: p, shareUrl }: { profile: Profile; shareUrl: string }) {
  return (
    <section className="ph-panel ph-id">
      <div className="ph-kepala">
        <span className="ph-cap">Catalyst Passport</span>
        <span className="ph-cap">{stageName(p.journeyStage)}</span>
      </div>

      <Avatar person={p} size={132} className="ph-foto" alt={p.fullName} />
      <h1 className="ph-nama">
        {p.fullName}
        {p.isVerified && (
          <>
            <Icon name="verified" className="ph-cek" title="Terverifikasi" />
            <span className="sr-only">Terverifikasi</span>
          </>
        )}
      </h1>
      {(p.headline || p.location) && (
        <p className="ph-sub">{[p.headline, p.location].filter(Boolean).join(' · ')}</p>
      )}

      <div className="ph-chip">
        <span>Catalyst ID</span>
        <b>{p.catalystId}</b>
        <CopyButton text={p.catalystId} label="Salin Catalyst ID" done="Catalyst ID tersalin" />
      </div>

      <div className="ph-aksi">
        <CopyButton text={shareUrl} label="Salin tautan profil" done="Tautan profil tersalin" className="ph-aksi-btn">
          <Icon name="share" />
          <span>Share</span>
        </CopyButton>
        <Link className="ph-aksi-btn" href="/passport/projects">
          <Icon name="plus" />
          <span>Add work</span>
        </Link>
        <Link className="ph-aksi-btn" href="/passport/profile">
          <Icon name="doc" />
          <span>CV</span>
        </Link>
        <Link className="ph-aksi-btn" href="/passport/journey">
          <Icon name="award" />
          <span>Badges</span>
        </Link>
      </div>
    </section>
  );
}

/* ---------- tiga angka ---------- */

/**
 * Garis kecil enam bulan terakhir. Tanpa sumbu dan tanpa angka: gunanya
 * menunjukkan arah, bukan dibaca persis. Datar bila riwayatnya rata.
 */
function Sparkline({ nilai }: { nilai: number[] }) {
  if (nilai.length < 2) return null;
  const maks = Math.max(...nilai);
  const min = Math.min(...nilai);
  const rentang = maks - min || 1;
  const L = 108;
  const T = 26;
  const titik = nilai.map((v, i) => {
    const x = (i / (nilai.length - 1)) * L;
    const y = T - ((v - min) / rentang) * (T - 3) - 1.5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg className="ph-spark" viewBox={`0 0 ${L} ${T}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={`0,${T} ${titik.join(' ')} ${L},${T}`} className="ph-spark-isi" />
      <polyline points={titik.join(' ')} className="ph-spark-garis" />
    </svg>
  );
}

export function StatPanels({
  profile: p,
  communities,
  badges,
  monthPoints,
  points,
}: {
  profile: Profile;
  communities: number;
  badges: number;
  monthPoints: number;
  points: PointEvent[];
}) {
  const seri = pointsSeries(points, p.cataPoints).map((t) => t.value);
  const baris: { label: string; nilai: string; catatan?: string; seri?: number[] }[] = [
    {
      label: 'CATA Points',
      nilai: angka(p.cataPoints),
      catatan: monthPoints > 0 ? `+${monthPoints} this month` : undefined,
      seri,
    },
    { label: 'Communities', nilai: String(communities) },
    { label: 'Badges', nilai: String(badges) },
  ];
  return (
    <div className="ph-angka">
      {baris.map((b) => (
        <section className="ph-panel ph-stat" key={b.label}>
          <span className="ph-cap">{b.label}</span>
          <b>{b.nilai}</b>
          {b.catatan && <i>{b.catatan}</i>}
          {b.seri && <Sparkline nilai={b.seri} />}
        </section>
      ))}
    </div>
  );
}

/* ---------- rel journey ---------- */

export function JourneyPanel({ profile: p }: { profile: Profile }) {
  const i = stageIndex(p.journeyStage);
  const berikut = STAGES[Math.min(i + 1, STAGES.length - 1)];
  const puncak = i >= STAGES.length - 1;

  return (
    <section className="ph-panel ph-journey">
      <div className="ph-kepala">
        <b className="ph-jdl">Journey</b>
        <span className="ph-cap">
          Stage {i + 1} of {STAGES.length}
        </span>
      </div>

      <ol className="ph-rel" aria-label="Tahap journey">
        {STAGES.map((s, n) => (
          <li key={s} className={n < i ? 'lewat' : n === i ? 'kini' : ''}>
            <span className="ph-titik" aria-hidden="true" />
            <span className="ph-tahap">{stageName(s)}</span>
          </li>
        ))}
      </ol>

      <p className="ph-ket">
        {puncak ? 'Tahap tertinggi. Pencapaian baru tetap tercatat di Journey.' : `Berikutnya ${stageName(berikut)}. Syaratnya: ${STAGE_RULES[berikut].summary.toLowerCase()}.`}
      </p>
      <Link className="ph-tautan" href="/passport/journey">
        See all stages
        <Icon name="arrow" />
      </Link>
    </section>
  );
}

/* ---------- apa yang belum diisi ---------- */

export interface Langkah {
  judul: string;
  ket: string;
  href: string;
  aksi: string;
}

export function langkahBerikut(p: Profile, projects: Project[], certificates: Certificate[], communities: number): Langkah[] {
  const semua: Langkah[] = [];
  if (!p.about?.trim())
    semua.push({ judul: 'Tulis tentang diri Anda', ket: 'Perlu sekitar satu menit', href: '/passport/profile', aksi: 'Write' });
  if (!p.cvFileName)
    semua.push({ judul: 'Unggah CV', ket: 'Yang pertama dilihat mitra', href: '/passport/profile', aksi: 'Upload' });
  if (projects.length === 0)
    semua.push({ judul: 'Tambah satu projek', ket: 'Membuka tahap Innovator', href: '/passport/projects', aksi: 'Add' });
  if (certificates.length === 0)
    semua.push({ judul: 'Tambah sertifikat', ket: 'Syarat tahap Challenger', href: '/passport/certificates', aksi: 'Add' });
  if (communities < 5)
    semua.push({ judul: 'Gabung komunitas', ket: `${communities} dari 5 untuk Connector`, href: '/passport/communities', aksi: 'Find' });
  if (p.skills.length === 0)
    semua.push({ judul: 'Isi keahlian', ket: 'Dipakai mesin pencarian orang', href: '/passport/skills', aksi: 'Fill' });
  return semua;
}

export function ChecklistPanel({ langkah, total }: { langkah: Langkah[]; total: number }) {
  const selesai = total - langkah.length;
  if (langkah.length === 0) {
    return (
      <section className="ph-panel">
        <div className="ph-kepala">
          <b className="ph-jdl">Passport Complete</b>
          <span className="ph-cap">{total} of {total}</span>
        </div>
        <p className="ph-ket" style={{ marginTop: 10 }}>
          Semua bagian sudah terisi. Perbarui kapan pun ada projek, sertifikat, atau komunitas baru.
        </p>
      </section>
    );
  }
  return (
    <section className="ph-panel">
      <div className="ph-kepala">
        <b className="ph-jdl">Next Steps</b>
        <span className="ph-cap">
          {selesai} of {total} done
        </span>
      </div>
      <ul className="ph-daftar">
        {langkah.slice(0, 3).map((l) => (
          <li key={l.judul}>
            <span className="ph-tl">
              {l.judul}
              <small>{l.ket}</small>
            </span>
            <Link className="ph-kecil" href={l.href}>
              {l.aksi}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- kegiatan terakhir ---------- */

interface Kegiatan {
  judul: string;
  waktu: string;
  kanan: string;
}

function waktuSingkat(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const menit = Math.floor((Date.now() - t) / 60000);
  if (menit < 60) return `${Math.max(menit, 1)} menit lalu`;
  if (menit < 1440) return `${Math.floor(menit / 60)} jam lalu`;
  const hari = Math.floor(menit / 1440);
  return hari === 1 ? 'Kemarin' : `${hari} hari lalu`;
}

export function ActivityPanel({ points, badges }: { points: PointEvent[]; badges: EarnedBadge[] }) {
  const isi: (Kegiatan & { kunci: string; urut: number })[] = [
    ...points.map((e, n) => ({
      kunci: `p${n}`,
      judul: e.reason,
      waktu: waktuSingkat(e.createdAt),
      kanan: `${e.delta > 0 ? '+' : ''}${e.delta}`,
      urut: new Date(e.createdAt).getTime(),
    })),
    ...badges.map((b) => ({
      kunci: `b${b.code}`,
      judul: `Badge ${b.name}`,
      waktu: waktuSingkat(b.earnedAt),
      kanan: 'New',
      urut: new Date(b.earnedAt).getTime(),
    })),
  ]
    .sort((a, b) => b.urut - a.urut)
    .slice(0, 4);

  return (
    <section className="ph-panel">
      <div className="ph-kepala">
        <b className="ph-jdl">Recent Activity</b>
        <Link className="ph-cap" href="/passport/journey">
          View All
        </Link>
      </div>
      {isi.length === 0 ? (
        <p className="ph-ket" style={{ marginTop: 10 }}>
          Belum ada kegiatan. Begitu komunitas Anda terverifikasi, catatannya muncul di sini.
        </p>
      ) : (
        <ul className="ph-daftar">
          {isi.map((k) => (
            <li key={k.kunci}>
              <span className="ph-tl">
                {k.judul}
                <small>{k.waktu}</small>
              </span>
              <span className="ph-nilai">{k.kanan}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- bagikan dan kartu ---------- */

export function SharePanel({ url }: { url: string }) {
  const tampil = url.replace(/^https?:\/\//, '');
  return (
    <section className="ph-panel">
      <b className="ph-jdl">Share</b>
      <p className="ph-alamat" title={tampil}>
        {tampil}
      </p>
      <CopyButton text={url} label="Salin tautan" done="Tautan tersalin" className="ph-utama">
        <span>Copy link</span>
      </CopyButton>
    </section>
  );
}

export function CardPanel({ profile: p }: { profile: Profile }) {
  return (
    <section className="ph-panel">
      <b className="ph-jdl">Passport Card</b>
      <div className="ph-kartu">
        <div className="ph-kartu-atas">
          <span>CATALYST</span>
          <Icon name="spark4" />
        </div>
        <div className="ph-kartu-no">{p.catalystId.replace(/(\D+)(\d+)/, (_, a, b) => `${a} ${String(b).split('').join(' ')}`)}</div>
        <div className="ph-kartu-bawah">
          <span>
            Holder
            <b>{p.fullName}</b>
          </span>
          <span>
            Stage
            <b>{stageName(p.journeyStage)}</b>
          </span>
        </div>
      </div>
    </section>
  );
}
