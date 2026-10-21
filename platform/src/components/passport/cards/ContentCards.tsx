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
import { STAGES, type JourneyEvent, type LinkKey, type Profile, type Project } from '@/lib/types';
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

/** Kanal yang selalu tampil di dasbor pemilik, terisi maupun belum, seperti desain awal. */
const INTI: LinkKey[] = ['linkedin', 'instagram', 'twitter', 'youtube', 'portfolio'];

export function AboutCard({ profile: p, owner = false }: { profile: Profile; owner?: boolean }) {
  const chips = SOSIAL.flatMap((s) => {
    const href = safeHref(p.links[s.key]);
    if (href) {
      return [
        <a key={s.key} className="pass-link" href={href} target="_blank" rel="noopener noreferrer me">
          <Icon name={s.icon} />
          {s.label}
        </a>,
      ];
    }
    // Pemilik melihat kanal inti yang belum diisi sebagai ajakan melengkapi;
    // pengunjung tidak melihat tautan kosong sama sekali.
    if (owner && INTI.includes(s.key)) {
      return [
        <Link key={s.key} className="pass-link kosong" href="/passport/profile#tautan" title="Belum diisi">
          <Icon name={s.icon} />
          {s.label}
        </Link>,
      ];
    }
    return [];
  });

  if (!p.about && chips.length === 0) return null;

  return (
    <section className="pass-card pass-about" aria-labelledby="pass-about-h">
      <h2 id="pass-about-h">About Me</h2>
      {p.about && <p>{p.about}</p>}
      {chips.length > 0 && <div className="pass-links">{chips}</div>}
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
};

export function JourneyCard({ profile, journey, owner = false }: { profile: Profile; journey: JourneyEvent[]; owner?: boolean }) {
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
              <div className={`pass-step${next ? ' next' : ''}${lewat ? ' done' : ''}`} aria-current={i === kini ? 'step' : undefined}>
                <Icon name={JOURNEY_ICON[s]} className="ico" />
                <b>{j?.title ?? stageName(s)}</b>
                <span>{j?.detail ?? STAGE_DETAIL[s]}</span>
                {next ? (
                  <span className="goal">Next Goal</span>
                ) : (
                  <em>{lewat && j ? bulanTahun(j.occurredAt) : lewat ? '' : 'Belum'}</em>
                )}
              </div>
            </li>
          );
        })}
      </ol>
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
          Belum ada projek. Projek pertama menaikkan tahap journey ke Builder.
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
