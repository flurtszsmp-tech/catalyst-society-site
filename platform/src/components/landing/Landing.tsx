import Image from 'next/image';
import Link from 'next/link';
import { T } from '@/lib/i18n/provider';
import { BrandMark, Icon } from '@/components/ui/Icon';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { EcoScroll } from './EcoScroll';
import { Hitung } from './Hitung';
import { Judul } from './Judul';
import { LandingRoot } from './LandingRoot';
import { Loader } from './Loader';

/* Port markup <main> index.html. Nav dan footer diganti SiteNav/SiteFooter. */

const MARQUEE = ['Connect', 'Collaborate', 'Create', 'Change', 'Learn', 'Build', 'Impact'];
const MITRA = ['BISA AI', 'BLOCKPLAY', 'YOT', 'BISNIS MUDA', 'AICO', 'TRADIX COMMUNITY', 'BUILD CLUB', 'NUSANTARA CODE'];

const INDUSTRI = [
  { img: '/assets/landing/tone-team.webp', ikon: 'cube', judul: 'AI & Technology', k: 'ind.ai.d' },
  { img: '/assets/landing/tone-notebook.webp', ikon: 'chart', judul: 'Business', k: 'ind.biz.d' },
  { img: '/assets/landing/tone-deboss.webp', ikon: 'capital', judul: 'Investments', k: 'ind.inv.d' },
  { img: '/assets/landing/tone-signage.webp', ikon: 'rocket', judul: 'Dev & Builder', k: 'ind.dev.d' },
  { img: '/assets/events/summit.webp', ikon: 'spark', judul: 'Social Impact', k: 'ind.soc.d' },
];

const PROGRAM = [
  { ikon: 'passport', judul: 'Catalyst Passport', k: 'p1', more: 'Digital Identity' },
  { ikon: 'search', judul: 'Catalyst Finder', k: 'p2', more: 'Opportunity Hub' },
  { ikon: 'cap', judul: 'Catalyst Academy', k: 'p3', more: null },
  { ikon: 'flask', judul: 'Catalyst Labs', k: 'p4', more: 'Incubation' },
  { ikon: 'rocket', judul: 'Catalyst Ventures', k: 'p5', more: 'Funding' },
  { ikon: 'spark', judul: 'Catalyst Summit', k: 'p6', more: 'The Stage' },
];

const ALUR = [
  ['Community', 'Join'],
  ['Academy', 'Learn'],
  ['Matchmaking', 'Connect'],
  ['Labs', 'Build'],
  ['Ventures', 'Scale'],
  ['Summit', 'Showcase'],
];

const DAPAT = [
  'Join the Community',
  'Access to the Event',
  'Collaboration',
  'Growing a Business',
  'Fundraising',
  'Job Opportunities',
  'Contest & Competitions',
  'Networking & Sharing',
  'Building a Project',
  'Showcasing a Project',
];

const NILAI = [
  { ikon: 'chart', judul: 'Growth' },
  { ikon: 'shield', judul: 'Integrity' },
  { ikon: 'users', judul: 'Collaboration' },
  { ikon: 'target', judul: 'Impact' },
  { ikon: 'spark', judul: 'Innovation' },
];

const nomor = (i: number) => String(i + 1).padStart(2, '0');
const DI_ATAS = { position: 'relative', zIndex: 1 } as const;

function Blobs({ a = true }: { a?: boolean }) {
  return (
    <div className="blobs" aria-hidden>
      {a && <div className="blob a" />}
      <div className="blob b" />
    </div>
  );
}

function PanahTukar() {
  return (
    <span className="panah-tukar">
      <Icon name="arrow" />
      <Icon name="arrow" />
    </span>
  );
}

function Kicker() {
  return (
    <div className="kicker">
      <span translate="no">Accelerating Future Builders.</span>
    </div>
  );
}

export function Landing() {
  return (
    <LandingRoot>
      <SiteNav active="home" onLanding />
      <Loader />
      <div className="cur" aria-hidden />
      <div className="cur-ring" aria-hidden />

      <main id="top">
        {/* hero */}
        <section className="hero" id="hero">
          <Blobs />
          <div className="wrap hero-inner">
            <div className="hero-top">
              <h1 className="h-xl">
                <span className="ln">
                  <span>Accelerating</span>
                </span>
                <span className="ln">
                  <span>Future</span>
                </span>
                <span className="ln">
                  <span>Builders.</span>
                </span>
              </h1>
              <a href="#programs" className="hero-explore">
                <T k="hero.jelajahi" />
                <span className="circle">
                  <Icon name="arrow" />
                </span>
              </a>
            </div>

            <div className="hero-bottom">
              <T as="p" className="desc" k="hero.desc" />
              <Link href="/login?mode=daftar" className="btn magnetic">
                <T k="hero.gabung" /> <PanahTukar />
              </Link>
            </div>
          </div>
        </section>

        <section className="stat-rail wrap">
          <div className="stats-row stagger">
            <div className="st">
              <b>25.430+</b>
              <span>Active Members</span>
            </div>
            <div className="st">
              <b>1.250+</b>
              <span>Active Projects</span>
            </div>
            <div className="st">
              <b>560+</b>
              <span>Projects Funded</span>
            </div>
            <div className="st">
              <b>32</b>
              <span>Countries</span>
            </div>
          </div>
          <div className="hero-marquee">
            <ul>
              {/* Deretan ditulis dua kali supaya putarannya menyambung; salinan kedua disembunyikan dari pembaca layar. */}
              {[...MARQUEE, ...MARQUEE].map((w, i) => (
                <li key={i} aria-hidden={i >= MARQUEE.length || undefined}>
                  {w}
                  {i === 0 && <span />}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* problem */}
        <section className="prob band dark on-dark" id="problem">
          <div className="wrap">
            <div className="shead shead--rail rv">
              <span className="snum">01</span>
              <div>
                <Kicker />
                <h2 className="h-lg">
                  <Judul k="s1.judul" />
                </h2>
                <T as="p" className="lead" k="s1.p1" />
                <T as="p" className="lead" k="s1.p2" />
              </div>
            </div>
            <div className="prob-grid">
              <div className="rv">
                <div className="prob-chips stagger">
                  {(
                    [
                      ['users', 'Mentor'],
                      ['network', 'Network'],
                      ['capital', 'Capital'],
                      ['door', 'Opportunity'],
                    ] as const
                  ).map(([ikon, label]) => (
                    <span key={label} className="chip">
                      <span className="chip-ring">
                        <Icon name={ikon} />
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
                <div className="prob-q glass solid">
                  <Icon name="spark4" className="mark" />
                  <T as="p" k="s1.tanya" />
                </div>
              </div>
              <div className="prob-media rv">
                <Image
                  src="/assets/landing/desk-v2.webp"
                  alt="Builder muda bekerja larut malam"
                  fill
                  sizes="(max-width: 1040px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ecosystem */}
        <section className="eco band" id="ecosystem">
          <Blobs />
          <div className="wrap" style={DI_ATAS}>
            <div className="shead shead--right rv">
              <span className="snum">02</span>
              <Kicker />
              <h2 className="h-lg">
                <Judul k="s2.judul" />
              </h2>
              <T as="p" className="eco-sub" k="s2.sub" />
              <T as="p" className="lead" k="s2.desc" />
            </div>

            <EcoScroll />

            <div className="eco-note glass rv">
              <Icon name="spark4" className="mark" />
              <div>
                <T as="b" k="note.satu" />
                <T k="note.tanpa" />
              </div>
            </div>
          </div>
        </section>

        {/* industries */}
        <section className="ind band dark on-dark" id="industries">
          <div className="wrap">
            <div className="shead shead--split rv">
              <div className="shs-main">
                <span className="snum">03</span>
                <Kicker />
                <h2 className="h-lg">
                  <Judul k="s3.judul" />
                </h2>
              </div>
              <T as="p" className="lead" k="s3.desc" />
            </div>

            <div className="ind-rail stagger">
              {INDUSTRI.map((d, i) => (
                <article key={d.k} className="ind-card">
                  <Image src={d.img} alt="" fill sizes="(max-width: 640px) 85vw, (max-width: 1040px) 45vw, 22vw" />
                  <div className="ind-sheen" />
                  <div className="ind-inner">
                    <span className="num">{nomor(i)}</span>
                    <Icon name={d.ikon} className="ico" />
                    <h3 translate="no">{d.judul}</h3>
                    <T as="p" k={d.k} />
                  </div>
                </article>
              ))}
            </div>

            <div className="partners rv">
              <T as="div" className="pl" k="ind.mitra" />
              <div className="track">
                <ul>
                  {[0, 1].map((salinan) => (
                    <MitraList key={salinan} salinan={salinan > 0} />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* programs */}
        <section className="prog band" id="programs">
          <Blobs a={false} />
          <div className="wrap" style={DI_ATAS}>
            <div className="shead shead--stagger rv">
              <span className="snum">04</span>
              <T as="div" className="kicker" k="s4.kicker" />
              <h2 className="h-lg">
                <Judul k="s4.judul" />
              </h2>
              <T as="p" className="prog-sub" k="s4.sub" />
            </div>

            <div className="rule-spark rv" aria-hidden>
              <Icon name="spark4" />
            </div>

            <div className="prog-grid stagger">
              {PROGRAM.map((p, i) => {
                const kepala = (
                  <>
                    <span className="pn">{nomor(i)}</span>
                    <span className="pico-ring">
                      <Icon name={p.ikon} className="pico" />
                    </span>
                    <h3 translate="no">{p.judul}</h3>
                  </>
                );
                return (
                  // tabIndex: sisi belakang juga bisa dibuka lewat papan ketik (:focus-visible)
                  <div key={p.k} className="flip" tabIndex={0}>
                    <div className="flip-in">
                      <div className="flip-face flip-front glass">
                        {kepala}
                        <T as="p" k={`${p.k}.d`} />
                      </div>
                      <div className="flip-face flip-back">
                        {kepala}
                        <T as="p" k={`${p.k}.b`} />
                        {p.more ? (
                          <span className="more">{p.more}</span>
                        ) : (
                          <span className="more" translate="no">
                            <T k="foot.tagline" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* summit */}
        <section className="summit band dark on-dark" id="summit">
          <div className="summit-media">
            <Image src="/assets/events/summit.webp" alt="Catalyst Summit 2027" fill sizes="100vw" />
          </div>
          <div className="wrap">
            <div className="shead shead--right rv">
              <span className="snum">06</span>
              <div className="kicker">
                <span translate="no">Catalyst Summit 2027</span>
              </div>
              <h2 className="h-lg">
                <Judul k="sum.judul" />
              </h2>
              <T as="p" className="lead" k="sum.desc" />
            </div>
            <div className="summit-stat rv">
              <Hitung className="big" end={100000000} prefix="Rp" />
              <div className="sm">
                <b>Best Project Innovation</b>
                <T k="sum.note" />
              </div>
            </div>
            <div className="summit-tags stagger">
              <div>
                <b>5</b>Industries
              </div>
              <div>
                <b>6</b>Programs
              </div>
              <div>
                <b>100+</b>Community Partners
              </div>
              <div>
                <b>32</b>Countries
              </div>
            </div>
          </div>
        </section>

        {/* alur ekosistem */}
        <section className="band" id="alur">
          <div className="wrap">
            <div className="shead shead--split rv">
              <div className="shs-main">
                <span className="snum">05</span>
                <T as="div" className="kicker" k="alur.kicker" />
                <h2 className="h-lg">
                  <Judul k="alur.judul" />
                </h2>
              </div>
              <p className="lead">
                5 Sektor Industri berkembang melalui program yang terstruktur. We are not building a community. We are
                building infrastructure that connects communities.
              </p>
            </div>

            <div className="flow stagger">
              {ALUR.map(([judul, kata], i) => (
                <div key={judul} className="flow-step glass">
                  <div className="n">{nomor(i)}</div>
                  <b translate="no">{judul}</b>
                  <i>{kata}</i>
                  <T as="p" k={`f${i + 1}.d`} />
                </div>
              ))}
            </div>

            <div className="kicker" style={{ marginTop: 38 }}>
              <T k="get.judul" />
            </div>
            <div className="get stagger">
              {DAPAT.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </section>

        {/* values */}
        <section className="val band">
          <div className="wrap">
            <div className="shead shead--center rv">
              <T as="div" className="kicker" k="val.kicker" />
              <h2 className="h-lg">
                <Judul k="val.judul" />
              </h2>
            </div>
            <div className="val-grid stagger">
              {NILAI.map((v, i) => (
                <div key={v.judul} className="val-cell">
                  <Icon name={v.ikon} />
                  <b>{v.judul}</b>
                  <T as="p" k={`v${i + 1}.d`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="cta band" id="join">
          <Blobs />
          <div className="wrap rv" style={DI_ATAS}>
            <BrandMark />
            <h2 className="h-lg">
              <Judul k="cta.judul" />
            </h2>
            <T as="p" className="lead" k="cta.desc" />
            <div className="hero-cta">
              <Link href="/login?mode=daftar" className="btn magnetic">
                <T k="cta.buat" /> <PanahTukar />
              </Link>
              <Link href="/login" className="btn ghost magnetic">
                <T k="cta.masuk" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* pita aksi, persis footer bar hitam di tiap slide */}
      <div className="actionbar">
        <div className="wrap ab-in">
          <div className="ab-item">
            <Icon name="users" />
            Connect
          </div>
          <div className="ab-item">
            <Icon name="cube" />
            Collaborate
          </div>
          <div className="ab-item">
            <Icon name="spark4" className="ab-spark" />
            Create
          </div>
          <div className="ab-item">
            <Icon name="chart" />
            Change
          </div>
        </div>
      </div>

      <SiteFooter onLanding />
    </LandingRoot>
  );
}

function MitraList({ salinan }: { salinan: boolean }) {
  // Salinan kedua hanya untuk putaran marquee yang menyambung.
  const sembunyi = salinan || undefined;
  return (
    <>
      {MITRA.map((m) => (
        <li key={m} translate="no" aria-hidden={sembunyi}>
          {m}
        </li>
      ))}
      <li aria-hidden={sembunyi}>
        <T k="ind.lainnya" />
      </li>
    </>
  );
}
