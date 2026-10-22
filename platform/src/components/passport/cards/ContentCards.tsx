/* ===========================================================
   Kartu kolom utama: About, Journey, Communities, Projects.
   Presentasional murni: data masuk lewat props, tanpa repo, supaya
   dasbor (data browser) dan profil publik (data server) memakai
   komponen yang sama persis.
   =========================================================== */
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { findCommunity } from '@/lib/data/communities';
import { STAGE_RULES } from '@/lib/repo/journey-rules';
import { STAGES, type JourneyEvent, type LinkKey, type Profile, type Project, type Stage } from '@/lib/types';
import { safeHref } from '@/lib/url';
import { STAGE_DETAIL, bulanTahun, localAsset, stageIndex, stageName } from './format';

/* ---------- About ---------- */

const SOSIAL: { key: LinkKey; label: string; icon: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram' },
  { key: 'twitter', label: 'Twitter / X', icon: 'x' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok' },
  { key: 'github', label: 'GitHub', icon: 'gh' },
  { key: 'facebook', label: 'Facebook', icon: 'fb' },
  { key: 'telegram', label: 'Telegram', icon: 'tg' },
  { key: 'website', label: 'Website', icon: 'globe' },
  { key: 'portfolio', label: 'Portfolio', icon: 'globe' },
];

/**
 * Teks kecil di bawah nama kanal: @username untuk media sosial, nama
 * domain untuk situs. Hanya untuk tampilan; tautannya tetap href asli.
 */
function alamatSingkat(href: string, key: LinkKey): string {
  try {
    const u = new URL(href);
    const host = u.hostname.replace(/^www\./, '');
    const bagian = u.pathname.split('/').filter(Boolean);
    const sosial: LinkKey[] = ['instagram', 'twitter', 'tiktok', 'github', 'telegram', 'youtube', 'facebook'];
    if (sosial.includes(key) && bagian.length) {
      const nama = decodeURIComponent(bagian[bagian.length - 1]).replace(/^@/, '');
      return `@${nama}`.slice(0, 32);
    }
    if (key === 'linkedin' && bagian.length >= 2) return `in/${decodeURIComponent(bagian[1])}`.slice(0, 32);
    return (host + (bagian.length ? `/${bagian.join('/')}` : '')).slice(0, 32);
  } catch {
    return '';
  }
}

/**
 * Tentang dan tautan sosial. Kanal yang belum diisi tidak ditampilkan sama
 * sekali, juga di dasbor pemilik; kartunya hilang bila keduanya kosong.
 */
export function AboutCard({ profile: p }: { profile: Profile; owner?: boolean }) {
  const tautan = SOSIAL.flatMap((s) => {
    const href = safeHref(p.links[s.key]);
    return href ? [{ ...s, href, sub: alamatSingkat(href, s.key) }] : [];
  });

  if (!p.about?.trim() && tautan.length === 0) return null;

  return (
    <section className="pass-card pass-about" aria-labelledby="pass-about-h">
      <h2 id="pass-about-h">About Me</h2>
      {p.about?.trim() && <p>{p.about}</p>}
      {tautan.length > 0 && (
        <ul className="pass-links">
          {tautan.map((t) => (
            <li key={t.key}>
              <a className={`pass-link is-${t.key}`} href={t.href} target="_blank" rel="noopener noreferrer me">
                <span className="pass-link-ico">
                  <Icon name={t.icon} />
                </span>
                <span className="pass-link-txt">
                  <b>{t.label}</b>
                  {t.sub && <small>{t.sub}</small>}
                </span>
                <Icon name="external" className="pass-link-go" />
                <span className="sr-only"> (membuka tab baru)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Journey ---------- */

const JOURNEY_ICON: Record<string, string> = {
  explorer: 'j-explorer',
  connector: 'j-connector',
  builder: 'j-builder',
  challenger: 'j-challenger',
  contributor: 'j-contributor',
  innovator: 'j-innovator',
  founder: 'j-founder',
};

export function JourneyCard({
  profile,
  journey,
  owner = false,
  onOpenStage,
}: {
  profile: Profile;
  journey: JourneyEvent[];
  owner?: boolean;
  /** Pemilik bisa membuka lagi kartu ucapan untuk tahap yang sudah dilewati. */
  onOpenStage?: (s: Stage) => void;
}) {
  const kini = stageIndex(profile.journeyStage);
  const peta = new Map(journey.map((j) => [j.stage, j]));
  // Tujuan berikutnya satu tahap di depan; di tahap terakhir, tahap itu sendiri.
  const tujuan = Math.min(kini + 1, STAGES.length - 1);

  return (
    <section className="pass-card" aria-labelledby="pass-journey-h">
      <div className="pass-head">
        <h2 id="pass-journey-h">Journey</h2>
        {owner && (
          <Link className="pass-all" href="/passport/journey">
            Lihat detail
          </Link>
        )}
      </div>
      <ol className="pass-journey">
        {STAGES.map((s, i) => {
          const j = peta.get(s);
          const lewat = i <= kini;
          const next = i === tujuan && i > kini;
          return (
            <li key={s} className="pass-step-wrap">
              {i > 0 && (
                <span className={`pass-join${lewat ? '' : ' off'}`} aria-hidden>
                  <Icon name="check" />
                </span>
              )}
              {(() => {
                const isi = (
                  <>
                    <Icon name={JOURNEY_ICON[s]} className="ico" />
                    <b>{j?.title ?? stageName(s)}</b>
                    <span>{j?.detail ?? STAGE_DETAIL[s]}</span>
                    {next ? (
                      <span className="goal">Next Goal</span>
                    ) : (
                      <em>{lewat && j ? bulanTahun(j.occurredAt) : lewat ? '' : s === 'founder' ? 'Eksklusif' : 'Belum'}</em>
                    )}
                  </>
                );
                const kelas = `pass-step${next ? ' next' : ''}${lewat ? ' done' : ''}${s === 'founder' ? ' founder' : ''}`;
                // Tahap yang sudah dilewati bisa diklik pemiliknya untuk membuka
                // kartu ucapan lagi, misalnya untuk diunggah ke media sosial.
                return owner && lewat && onOpenStage ? (
                  <button
                    type="button"
                    className={`${kelas} can-open`}
                    aria-current={i === kini ? 'step' : undefined}
                    onClick={() => onOpenStage(s)}
                    title={`Buka kartu ${stageName(s)}`}
                  >
                    {isi}
                  </button>
                ) : (
                  <div className={kelas} aria-current={i === kini ? 'step' : undefined}>
                    {isi}
                  </div>
                );
              })()}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- posisi Journey (profil publik) ---------- */

/**
 * Untuk pengunjung profil publik: tahap yang sedang ditempati, posisinya di
 * antara tujuh tahap, dan arti tahap itu dalam bahasa orang ketiga.
 */
export function JourneyPositionCard({ profile, journey }: { profile: Profile; journey: JourneyEvent[] }) {
  const s = profile.journeyStage;
  const kini = stageIndex(s);
  const r = STAGE_RULES[s];
  const ev = journey.find((j) => j.stage === s);
  return (
    <section className="pass-card jpos" aria-labelledby="pass-jpos-h">
      <div className="pass-head">
        <h2 id="pass-jpos-h">Journey</h2>
        <span className="pass-all">
          Tahap {kini + 1} dari {STAGES.length}
        </span>
      </div>
      <div className="jpos-top">
        <span className="jpos-ico" aria-hidden>
          <Icon name={JOURNEY_ICON[s]} />
        </span>
        <div className="jpos-name">
          <b>{r.name}</b>
          <span>
            {r.summary}
            {ev && ` · sejak ${bulanTahun(ev.occurredAt)}`}
          </span>
        </div>
      </div>
      <ol className="jpos-track" aria-label={`Posisi ${r.name} di antara ${STAGES.length} tahap`}>
        {STAGES.map((x, i) => (
          <li key={x} className={i < kini ? 'done' : i === kini ? 'now' : undefined} aria-current={i === kini ? 'step' : undefined}>
            <span className="bar" />
            <em>{stageName(x)}</em>
          </li>
        ))}
      </ol>
      <p className="jpos-about">{r.publicAbout}</p>
      <ul className="jpos-signals">
        {r.signals.map((t) => (
          <li key={t}>
            <Icon name="check" />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Communities ---------- */

export function CommunitiesCard({ slugs, owner = false }: { slugs: string[]; owner?: boolean }) {
  if (!owner && slugs.length === 0) return null;
  const items = slugs.map((s) => ({ slug: s, c: findCommunity(s) }));

  return (
    <section className="pass-card" aria-labelledby="pass-coms-h">
      <div className="pass-head">
        <h2 id="pass-coms-h">Communities</h2>
        {/* Semua komunitas sudah tampil di kartu ini; tamu hanya melihat
            jumlahnya, pemilik mendapat tautan ke halaman kelolanya. */}
        {owner ? (
          <Link className="pass-all" href="/passport/communities">
            View all ({slugs.length})
          </Link>
        ) : (
          <span className="pass-all">{slugs.length}</span>
        )}
      </div>
      <ul className="pass-coms">
        {items.map(({ slug, c }) => {
          const logo = localAsset(c?.logo);
          const nama = c?.name ?? slug;
          return (
            <li key={slug}>
              <Link className="pass-com" href={`/communities/${encodeURIComponent(slug)}`}>
                {logo ? (
                  <Image src={logo} alt="" width={52} height={52} />
                ) : (
                  <span className="pass-ini pass-com-ini" aria-hidden>
                    {nama.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span>{nama}</span>
              </Link>
            </li>
          );
        })}
        {owner && (
          <li>
            <Link className="pass-com add" href="/passport/communities">
              <Icon name="plus" />
              Join More Communities
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}

/* ---------- Projects ---------- */

function rentang(p: Project): string {
  const a = bulanTahun(p.startedOn);
  const b = p.endedOn ? bulanTahun(p.endedOn) : 'Sekarang';
  return a ? `${a} – ${b}` : p.endedOn ? `Selesai ${b}` : '';
}

export function ProjectsCard({ projects, owner = false }: { projects: Project[]; owner?: boolean }) {
  if (!owner && projects.length === 0) return null;

  return (
    <section className="pass-card" aria-labelledby="pass-proj-h">
      <div className="pass-head">
        <h2 id="pass-proj-h">Projects</h2>
        {owner && (
          <Link className="pass-all" href="/passport/projects">
            {projects.length ? `View all (${projects.length})` : 'Tambah projek'}
          </Link>
        )}
      </div>
      {projects.length === 0 ? (
        <p className="pass-muted">
          Belum ada projek. Projek atau komunitas yang pernah Anda bangun adalah syarat tahap Innovator.
        </p>
      ) : (
        <ul className="pass-proj-list">
          {projects.slice(0, 3).map((p) => {
            const href = safeHref(p.url);
            const waktu = rentang(p);
            return (
              <li key={p.id} className="pass-proj">
                <div className="pass-proj-body">
                  <h3>{p.title}</h3>
                  {p.description && <p>{p.description}</p>}
                  <div className="pass-proj-meta">
                    {p.role && <span className="pass-tag">{p.role}</span>}
                    {waktu && <time>{waktu}</time>}
                  </div>
                </div>
                <div className="pass-proj-side">
                  {p.collaborators > 0 && (
                    <span className="pass-faces" title={`${p.collaborators} kolaborator`}>
                      <span className="more">+{p.collaborators}</span>
                    </span>
                  )}
                  {href ? (
                    <a className="pass-outline" href={href} target="_blank" rel="noopener noreferrer">
                      View Project
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
