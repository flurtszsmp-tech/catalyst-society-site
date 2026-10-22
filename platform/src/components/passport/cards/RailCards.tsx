/* ===========================================================
   Kartu kolom kanan: CATA Points, Badges, Certificates, dan pita
   nilai di bawah. Presentasional murni, seperti ContentCards.
   =========================================================== */
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Certificate, EarnedBadge, PointEvent, Profile } from '@/lib/types';
import { certificateImageSrc } from '@/lib/url';
import { CertStatus } from './CertStatus';
import { angka, canOptimize, monthDelta, pointsSeries } from './format';

/* ---------- CATA Points ---------- */

export function PointsCard({
  profile,
  events,
  owner = false,
  now,
}: {
  profile: Profile;
  events: PointEvent[];
  owner?: boolean;
  /** Tanggal acuan; diteruskan dari server supaya render server dan browser sama. */
  now?: Date;
}) {
  const acuan = now ?? new Date();
  const seri = pointsSeries(events, profile.cataPoints, acuan);
  const delta = owner ? monthDelta(events, acuan) : 0;

  const W = 300;
  const H = 66;
  const pad = 5;
  const nilai = seri.map((s) => s.value);
  const min = Math.min(...nilai);
  const max = Math.max(...nilai);
  const r = max - min || 1;
  const titik = seri.map((s, i) => [
    seri.length > 1 ? (i / (seri.length - 1)) * W : W / 2,
    H - pad - ((s.value - min) / r) * (H - pad * 2),
  ]);
  let d = `M${titik[0][0].toFixed(1)} ${titik[0][1].toFixed(1)}`;
  for (let i = 1; i < titik.length; i++) {
    const [ax, ay] = titik[i - 1];
    const [bx, by] = titik[i];
    const cx = (ax + bx) / 2;
    d += ` C${cx.toFixed(1)} ${ay.toFixed(1)} ${cx.toFixed(1)} ${by.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }

  return (
    <section className="pass-card" aria-labelledby="pass-pts-h">
      <h2 id="pass-pts-h">CATA Points</h2>
      <div className="pass-pts">
        <div>
          <div className="pass-pts-num">
            <Icon name="bolt" />
            {angka(profile.cataPoints)}
          </div>
          <div className="pass-pts-cap">Total Points</div>
        </div>
        {delta > 0 && (
          <span className="pass-delta">
            <Icon name="up" />+{angka(delta)} bulan ini
          </span>
        )}
      </div>
      {/* Riwayat poin hanya terbaca pemiliknya (RLS). Tanpa riwayat, grafik
          akan datar dan menyesatkan, jadi tidak ditampilkan sama sekali. */}
      {events.length > 0 && (
      <figure className="pass-spark">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Total poin enam bulan terakhir: ${seri.map((s) => `${s.label} ${s.value}`).join(', ')}`}>
          <path className="line" vectorEffect="non-scaling-stroke" d={d} />
          {titik.map(([x, y], i) => (
            <circle key={i} className="node" cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.6" />
          ))}
        </svg>
        <figcaption className="pass-months" aria-hidden>
          {seri.map((s, i) => (
            <span key={i}>{s.label}</span>
          ))}
        </figcaption>
      </figure>
      )}
      {owner && (
        <Link className="pass-analytics" href="/passport/analytics">
          View Analytics
          <Icon name="arrow" />
        </Link>
      )}
    </section>
  );
}

/* ---------- Badges ---------- */

const BADGE_ICON: Record<string, string> = {
  spark: 'b-spark',
  users: 'b-users',
  search: 'b-search',
  globe: 'b-globe',
  rocket: 'b-rocket',
  badge: 'b-badge',
  cube: 'b-cube',
  crown: 'b-crown',
};

export function BadgesCard({
  badges,
  owner = false,
  footer,
}: {
  badges: EarnedBadge[];
  owner?: boolean;
  /** Isi di bawah lencana, misalnya tombol Lihat CV. */
  footer?: ReactNode;
}) {
  if (!owner && badges.length === 0 && !footer) return null;
  // Lencana terbaru dibuat padat, menandai capaian paling akhir.
  const terbaru = badges.reduce<EarnedBadge | null>((a, b) => (!a || b.earnedAt > a.earnedAt ? b : a), null);

  return (
    <section className="pass-card" aria-labelledby="pass-badges-h">
      <div className="pass-head">
        <h2 id="pass-badges-h">Badges</h2>
        <span className="pass-all">{badges.length} diraih</span>
      </div>
      {badges.length === 0 ? (
        <p className="pass-muted">Belum ada lencana. Lengkapi profil dan ajukan komunitas Anda untuk mendapatkannya.</p>
      ) : (
        <ul className="pass-badges">
          {badges.map((b) => (
            <li key={b.code} className={`pass-badge${terbaru?.code === b.code ? ' solid' : ''}`} title={b.description ?? undefined}>
              <span className="pass-hex">
                <Icon name="hex" className="frame" />
                <Icon name={BADGE_ICON[b.icon] ?? 'b-spark'} className="ico" />
              </span>
              <span>{b.name}</span>
            </li>
          ))}
        </ul>
      )}
      {footer && <div className="pass-badges-foot">{footer}</div>}
    </section>
  );
}

/* ---------- Certificates ---------- */

export function CertificatesCard({ certificates, owner = false }: { certificates: Certificate[]; owner?: boolean }) {
  if (!owner && certificates.length === 0) return null;

  return (
    <section className="pass-card" aria-labelledby="pass-certs-h">
      <div className="pass-head">
        <h2 id="pass-certs-h">Certificates</h2>
        {owner ? (
          <Link className="pass-all" href="/passport/certificates">
            {certificates.length ? `View all (${certificates.length})` : 'Tambah'}
          </Link>
        ) : (
          <span className="pass-all">{certificates.length}</span>
        )}
      </div>
      {certificates.length === 0 ? (
        <p className="pass-muted">Belum ada sertifikat.</p>
      ) : (
        <ul className="pass-certs">
          {certificates.slice(0, 2).map((c) => {
            const src = certificateImageSrc(c.imagePath);
            return (
              <li key={c.id} className="pass-cert">
                <div className="thumb">
                  {src ? (
                    <Image src={src} alt="" width={400} height={290} unoptimized={!canOptimize(src)} />
                  ) : (
                    <Icon name="award" className="pass-cert-ico" />
                  )}
                  <CertStatus verified={c.isVerified} />
                </div>
                <div className="meta">
                  <b>{c.title}</b>
                  <span>{c.issuer}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------- pita nilai ---------- */

const NILAI = [
  { icon: 's-showcase', title: 'Showcase Everything', text: 'Semua capaian, keahlian, dan pengalaman Anda dalam satu tempat.' },
  { icon: 's-journey', title: 'Track Your Journey', text: 'Setiap langkah yang Anda ambil tercatat dan menjadi dampak.' },
  { icon: 's-network', title: 'Build Your Network', text: 'Terhubung dengan builders, mentor, investor, dan peluang.' },
  { icon: 's-impact', title: 'Create Your Impact', text: 'Ikut projek, bangun solusi, dan ciptakan perubahan.' },
];

export function ValueStrip() {
  return (
    <footer className="pass-strip">
      <div className="pass-strip-in">
        {NILAI.map((n) => (
          <div key={n.title} className="pass-value">
            <Icon name={n.icon} />
            <div>
              <b>{n.title}</b>
              <p>{n.text}</p>
            </div>
          </div>
        ))}
        <div className="pass-strip-mark" aria-hidden>
          <svg className="mark" viewBox="-108 -118 244 236">
            <path d="M 79.86 -60.18 A 100 100 0 1 0 79.86 60.18 L 49.52 37.31 A 62 62 0 1 1 49.52 -37.31 Z" />
            <path d="M 126.5 -87.7 Q 108.05 -84.22 104.8 -64.5 Q 101.55 -84.22 83.1 -87.7 Q 101.55 -91.18 104.8 -110.9 Q 108.05 -91.18 126.5 -87.7 Z" />
          </svg>
          <span>
            <b translate="no">CATALYST</b>
            <span translate="no">PASSPORT</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
