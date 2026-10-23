'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCelebration } from '@/components/passport/journey/Celebration';
import { usePassport } from '@/components/passport/PassportProvider';
import { ConfirmDialog, Modal } from '@/components/ui/Dialog';
import { FormError, SubmitButton, TextArea, TextField } from '@/components/ui/form';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { CLAIM_INFO, STAGE_RULES, requirementStates, type RequirementState } from '@/lib/repo/journey-rules';
import { STAGES, type ClaimKind, type JourneyClaim, type JourneyEvent, type JourneyProgress, type Stage } from '@/lib/types';
import { Card, EmptyState, ErrorState, PageHead, SessionGate, Skeleton, errMsg, fmtDate, fmtNumber, fmtPoints, useLoad } from './common';
import { reasonLabel } from './labels';

type StageState = 'done' | 'current' | 'goal' | 'locked';

const STATE_LABEL: Record<StageState, string> = {
  done: 'Tercapai',
  current: 'Tahap saat ini',
  goal: 'Tujuan berikutnya',
  locked: 'Belum terbuka',
};

const CLAIM_STATUS: Record<JourneyClaim['status'], string> = {
  pending: 'Menunggu pemeriksaan',
  approved: 'Diterima',
  rejected: 'Ditolak',
};

/** Cara mendapat poin CATA. Harus sama dengan private.give_points di migrasi 0002 dan 0003. */
const CARA_POIN = [
  { label: 'Membuat Catalyst Passport', poin: '+10' },
  { label: 'Melengkapi profil: foto, headline, tentang, dan tiga keahlian', poin: '+20' },
  { label: 'Projek pertama', poin: '+15' },
  { label: 'Mencapai tahap Connector', poin: '+25' },
  { label: 'Mencapai tahap Challenger', poin: '+50' },
  { label: 'Mencapai tahap Innovator', poin: '+75' },
  { label: 'Mencapai tahap Contributor', poin: '+100' },
  { label: 'Mencapai tahap Builder', poin: '+150' },
  { label: 'Mencapai tahap Founder', poin: '+300' },
];

const PRINSIP = [
  { icon: 'journey', title: 'Berurutan', text: 'Setiap tahap membuka tahap berikutnya. Syarat yang terpenuhi lebih awal tetap tercatat.' },
  { icon: 'up', title: 'Hanya naik', text: 'Tahap yang sudah dicapai tidak pernah turun, walau datanya kemudian diubah.' },
  { icon: 'bolt', title: 'Poin terpisah', text: 'Poin CATA tidak menaikkan tahap. Poin ditukar dengan merchandise, akses event, dan program.' },
  { icon: 'shield-check', title: 'Diverifikasi', text: 'Syarat di luar Passport diperiksa tim Catalyst, biasanya dalam 1–3 hari kerja.' },
];

const FAQ = [
  {
    q: 'Apa itu Journey?',
    a: 'Journey adalah catatan perjalanan Anda di ekosistem Catalyst Society: dari bergabung, membangun jaringan, belajar, membangun, sampai menjadi Founder. Tahap Anda tampil di Catalyst Passport publik.',
  },
  {
    q: 'Apakah poin CATA menaikkan tahap?',
    a: 'Tidak. Tahap hanya naik karena aktivitas nyata. Poin CATA adalah hadiah terpisah yang bisa ditukar dengan merchandise, akses event, dan program Catalyst.',
  },
  {
    q: 'Tahap mana yang perlu diverifikasi tim?',
    a: 'Challenger (sesi bootcamp), Contributor (Catalyst Finder), Builder (Catalyst Labs), dan Founder (valuasi bisnis). Connector dan Innovator terbuka otomatis dari data Passport Anda.',
  },
  {
    q: 'Bolehkah saya mengajukan verifikasi sebelum mencapai tahap sebelumnya?',
    a: 'Boleh. Pengajuan yang diterima disimpan, dan tahapnya terbuka otomatis begitu tahap-tahap sebelumnya terpenuhi.',
  },
  {
    q: 'Bagaimana jika pengajuan saya ditolak?',
    a: 'Tim menuliskan alasannya di bagian Pengajuan saya. Perbaiki keterangan atau buktinya, lalu ajukan ulang kapan saja.',
  },
  {
    q: 'Apa keuntungan tahap Founder?',
    a: 'Founder adalah akses eksklusif untuk pemilik bisnis bervaluasi di atas Rp100 juta. Setelah diverifikasi, Anda mendapat +300 poin CATA, lencana Founder, dan merchandise eksklusif Catalyst.',
  },
];

interface JourneyData {
  events: JourneyEvent[];
  progress: JourneyProgress;
}

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export function JourneySection() {
  const { repo, user, profile, loading, error, reload } = usePassport();
  const { openStage } = useCelebration();
  const toast = useToast();
  const uid = user?.id ?? null;

  const loadJourney = useMemo(
    () =>
      uid
        ? async (): Promise<JourneyData> => {
            const [events, progress] = await Promise.all([repo.listJourney(uid), repo.getJourneyProgress()]);
            return { events, progress };
          }
        : null,
    [repo, uid],
  );
  const loadPoints = useMemo(() => (uid ? () => repo.listMyPointEvents() : null), [repo, uid]);
  const journey = useLoad(loadJourney);
  const points = useLoad(loadPoints);
  const history = useMemo(() => (points.data ?? []).filter((p) => p.delta !== 0).reverse(), [points.data]);

  const [ajukan, setAjukan] = useState<ClaimKind | null>(null);
  const [batal, setBatal] = useState<JourneyClaim | null>(null);
  const [sibukBatal, setSibukBatal] = useState(false);

  const segarkan = () => {
    journey.retry();
    void reload();
  };

  async function batalkan() {
    if (!batal) return;
    setSibukBatal(true);
    try {
      await repo.cancelClaim(batal.id);
      toast('Pengajuan dibatalkan.');
      setBatal(null);
      journey.retry();
    } catch (e) {
      toast(errMsg(e, 'Gagal membatalkan pengajuan.'), 'error');
    } finally {
      setSibukBatal(false);
    }
  }

  return (
    <div className="ps2">
      <PageHead
        title="Journey"
        lead="Tujuh tahap perjalanan Anda di Catalyst Society, dari Explorer sampai Founder. Ikuti panduan di bawah untuk naik ke tahap berikutnya."
      />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        {profile && (
          <>
            <Card id="ps2-stages-title" title="Tahap perjalanan">
              {journey.error ? (
                <ErrorState message={journey.error} onRetry={journey.retry} />
              ) : !journey.data ? (
                <Skeleton rows={2} height={110} label="Memuat tahap Journey…" />
              ) : (
                <StageTrack current={profile.journeyStage} data={journey.data} onOpen={openStage} onClaim={setAjukan} />
              )}
            </Card>

            <Card id="ps2-guide-title" title="Panduan tahap Journey">
              <ul className="jg-prinsip">
                {PRINSIP.map((p) => (
                  <li key={p.title}>
                    <span className="jg-prinsip-ico" aria-hidden>
                      <Icon name={p.icon} />
                    </span>
                    <b>{p.title}</b>
                    <small>{p.text}</small>
                  </li>
                ))}
              </ul>
              <ol className="jg-line">
                {STAGES.map((s, i) => (
                  <GuideStage
                    key={s}
                    stage={s}
                    index={i}
                    current={STAGES.indexOf(profile.journeyStage)}
                    progress={journey.data?.progress ?? null}
                    onClaim={setAjukan}
                  />
                ))}
              </ol>
            </Card>

            {journey.data && journey.data.progress.claims.length > 0 && (
              <Card id="ps2-claims-title" title="Pengajuan saya">
                <ul className="ps2-list jr-claims">
                  {journey.data.progress.claims.map((c) => (
                    <li key={c.id}>
                      <span>
                        <b>{CLAIM_INFO[c.kind].title}</b>
                        <small>{c.detail}</small>
                        {c.valuation ? <small>Valuasi {rp(c.valuation)}</small> : null}
                        <small>Diajukan {fmtDate(c.createdAt)}</small>
                        {c.reviewNote && <small className="jr-note">Catatan tim: {c.reviewNote}</small>}
                      </span>
                      <span className="jr-claim-side">
                        <span className={`ps2-pill jr-st is-${c.status}`}>{CLAIM_STATUS[c.status]}</span>
                        {c.status === 'pending' && (
                          <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" onClick={() => setBatal(c)}>
                            Batalkan
                          </button>
                        )}
                        {c.status === 'rejected' && (
                          <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" onClick={() => setAjukan(c.kind)}>
                            Ajukan ulang
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="ps2-grid-2">
              <Card
                id="ps2-points-title"
                title="Riwayat poin CATA"
                aside={
                  <p className="ps2-total">
                    Saldo <b>{fmtNumber(profile.cataPoints)} poin</b>
                  </p>
                }
              >
                {points.error ? (
                  <ErrorState message={points.error} onRetry={points.retry} />
                ) : !points.data ? (
                  <Skeleton rows={4} height={40} label="Memuat riwayat poin…" />
                ) : history.length === 0 ? (
                  <EmptyState icon="spark" title="Belum ada poin">
                    Poin CATA muncul di sini saat profil Anda lengkap atau Anda naik tahap.
                  </EmptyState>
                ) : (
                  <ol className="ps2-list ps2-points">
                    {history.map((p, i) => (
                      <li key={`${p.reason}-${p.createdAt}-${i}`}>
                        <span>
                          {reasonLabel(p.reason)}
                          <time dateTime={p.createdAt}>{fmtDate(p.createdAt)}</time>
                        </span>
                        <b aria-label={`${fmtPoints(p.delta)} poin`}>{fmtPoints(p.delta)}</b>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>

              <Card id="ps2-earn-title" title="Cara mendapat poin CATA">
                <ul className="ps2-list jr-earn">
                  {CARA_POIN.map((c) => (
                    <li key={c.label}>
                      <span>{c.label}</span>
                      <b>{c.poin}</b>
                    </li>
                  ))}
                </ul>
                <p className="ps2-sub" style={{ marginTop: 12 }}>
                  Setiap alasan hanya dihadiahkan sekali. Bergabung ke komunitas, mengikuti orang, dan menambah sertifikat tidak memberi
                  poin, supaya poin tetap bernilai saat ditukar.
                </p>
              </Card>
            </div>

            <Card id="ps2-faq-title" title="Pertanyaan umum">
              <div className="jg-faq">
                {FAQ.map((f) => (
                  <details key={f.q}>
                    <summary>
                      {f.q}
                      <Icon name="chevron" />
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </Card>

            {ajukan && (
              <ClaimDialog
                kind={ajukan}
                onClose={() => setAjukan(null)}
                onDone={() => {
                  setAjukan(null);
                  segarkan();
                }}
              />
            )}
            <ConfirmDialog
              open={!!batal}
              title="Batalkan pengajuan?"
              message={<p>Pengajuan {batal ? CLAIM_INFO[batal.kind].title : ''} akan dihapus dari antrean tim.</p>}
              confirmLabel="Batalkan pengajuan"
              danger
              busy={sibukBatal}
              onConfirm={() => void batalkan()}
              onCancel={() => setBatal(null)}
            />
          </>
        )}
      </SessionGate>
    </div>
  );
}

/* ---------- linimasa panduan ---------- */

function GuideStage({
  stage,
  index,
  current,
  progress,
  onClaim,
}: {
  stage: Stage;
  index: number;
  current: number;
  progress: JourneyProgress | null;
  onClaim: (k: ClaimKind) => void;
}) {
  const r = STAGE_RULES[stage];
  const reqs: RequirementState[] = progress
    ? requirementStates(stage, progress)
    : r.requirements.map((q) => ({ ...q, have: 0, done: false }));
  const keadaan = index <= current ? 'done' : index === current + 1 ? 'goal' : 'locked';

  return (
    <li className={`jg-stage stg-${stage} is-${keadaan}${r.exclusive ? ' is-exclusive' : ''}`}>
      <span className="jg-rail" aria-hidden>
        <span className="jg-dot">{index <= current ? <Icon name="check" /> : index + 1}</span>
      </span>
      <article className="jg-card" aria-labelledby={`jg-${stage}`}>
        <header className="jg-head">
          <span className="jg-ico" aria-hidden>
            <Icon name={`j-${stage}`} />
          </span>
          <div className="jg-title">
            <small>
              Tahap {index + 1} dari {STAGES.length}
            </small>
            <h3 id={`jg-${stage}`}>
              {r.name}
              {r.exclusive && <span className="jg-tag is-gold">Akses eksklusif</span>}
            </h3>
            <p>{r.summary}</p>
          </div>
          <div className="jg-meta">
            <span className={`jg-tag${r.verifier === 'tim' ? ' is-team' : ''}`}>
              <Icon name={r.verifier === 'tim' ? 'shield-check' : 'bolt'} />
              {r.verifier === 'tim' ? 'Diverifikasi tim' : 'Otomatis'}
            </span>
            {keadaan === 'done' && <span className="jg-tag is-done">Tercapai</span>}
            {keadaan === 'goal' && <span className="jg-tag is-goal">Tujuan berikutnya</span>}
          </div>
        </header>

        <p className="jg-about">{r.about}</p>

        <div className="jg-grid">
          <section>
            <h4>Syarat</h4>
            <ul className="jg-reqs">
              {reqs.map((q) => {
                const target = q.target ?? 1;
                return (
                  <li key={q.key} className={q.done ? 'is-done' : undefined}>
                    <span className="jg-check" aria-hidden>
                      {q.done ? <Icon name="check" /> : q.claimStatus === 'pending' ? <Icon name="clock" /> : null}
                    </span>
                    <span className="jg-req-txt">
                      {q.label}
                      {q.claim ? (
                        <em className={`jg-st is-${q.claimStatus ?? 'none'}`}>
                          {q.claimStatus ? CLAIM_STATUS[q.claimStatus] : 'Belum diajukan'}
                        </em>
                      ) : (
                        progress &&
                        q.key !== 'signup' && (
                          <em className="jg-st">
                            {Math.min(q.have, target)} / {target} {q.unit}
                          </em>
                        )
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <h4>Cara memenuhi</h4>
            <ol className="jg-steps">
              {r.steps.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="jg-foot">
          <span className="jg-reward">
            <Icon name="trophy" />
            {r.points > 0 ? `+${r.points} poin CATA` : 'Titik awal'}
            {r.perk ? ` · ${r.perk}` : ''}
          </span>
          <span className="jg-act">
            {reqs
              .filter((q) => q.claim && !q.done && q.claimStatus !== 'pending')
              .map((q) => (
                <button key={q.key} type="button" className="ui-btn ui-btn-primary ps2-btn-sm" onClick={() => onClaim(q.claim!)}>
                  {q.claimStatus === 'rejected' ? 'Ajukan ulang' : 'Ajukan verifikasi'}
                </button>
              ))}
            {reqs
              .filter((q) => !q.done && q.href && q.cta)
              .map((q) => (
                <Link key={q.key} className="ui-btn ui-btn-ghost ps2-btn-sm" href={q.href!}>
                  {q.cta}
                  <Icon name="arrow" />
                </Link>
              ))}
          </span>
        </footer>
      </article>
    </li>
  );
}

/* ---------- tahap ringkas dan tujuan berikutnya ---------- */

function StageTrack({
  current,
  data,
  onOpen,
  onClaim,
}: {
  current: Stage;
  data: JourneyData;
  onOpen: (s: Stage) => void;
  onClaim: (k: ClaimKind) => void;
}) {
  const reached = new Map(data.events.map((e) => [e.stage, e]));
  const currentIdx = Math.max(0, STAGES.indexOf(current));
  const next = STAGES[currentIdx + 1] as Stage | undefined;

  const stateOf = (i: number): StageState =>
    i === currentIdx ? 'current' : i < currentIdx ? 'done' : i === currentIdx + 1 ? 'goal' : 'locked';

  return (
    <div className="ps2-goal">
      <ol className="ps2-stages jr-stages" aria-label="Tujuh tahap Journey">
        {STAGES.map((s, i) => {
          const st = stateOf(i);
          const ev = reached.get(s);
          const r = STAGE_RULES[s];
          const isi = (
            <>
              <Icon name={`j-${s}`} className="ps2-stage-ico" />
              <span className="ps2-stage-state">{STATE_LABEL[st]}</span>
              <b>
                {i + 1}. {r.name}
              </b>
              <small>{r.summary}</small>
              {ev && (
                <small>
                  <time dateTime={ev.occurredAt}>{fmtDate(ev.occurredAt)}</time>
                </small>
              )}
              {i <= currentIdx && <span className="jr-open">Lihat kartu</span>}
            </>
          );
          return (
            <li key={s} className={`ps2-stage stg-${s} is-${st}${r.exclusive ? ' is-exclusive' : ''}`} aria-current={st === 'current' ? 'step' : undefined}>
              {i <= currentIdx ? (
                <button type="button" className="jr-stage-btn" onClick={() => onOpen(s)} aria-label={`Buka kartu ${r.name}`}>
                  {isi}
                </button>
              ) : (
                isi
              )}
            </li>
          );
        })}
      </ol>

      {next ? (
        <GoalPanel stage={next} data={data} onClaim={onClaim} />
      ) : (
        <p className="ps2-note">Anda sudah berada di tahap tertinggi, Founder. Tim Catalyst akan menghubungi Anda untuk merchandise eksklusif.</p>
      )}
    </div>
  );
}

function GoalPanel({ stage, data, onClaim }: { stage: Stage; data: JourneyData; onClaim: (k: ClaimKind) => void }) {
  const r = STAGE_RULES[stage];
  const reqs = requirementStates(stage, data.progress);
  const selesai = reqs.filter((q) => q.done).length;

  return (
    <div className="ps2-card jr-goal" style={{ margin: 0 }}>
      <div className="jr-goal-top">
        <div>
          <p className="ps2-kicker">Tujuan berikutnya</p>
          <h3>{r.name}</h3>
        </div>
        <span className="jr-goal-count">
          {selesai} / {reqs.length} syarat
        </span>
      </div>
      <p>{r.about}</p>
      <ul className="jr-reqs">
        {reqs.map((q) => (
          <Requirement key={q.key} q={q} onClaim={onClaim} />
        ))}
      </ul>
      <p className="ps2-sub">
        Hadiah tahap ini: +{r.points} poin CATA{r.perk ? ` dan ${r.perk}` : ''}.
      </p>
    </div>
  );
}

function Requirement({ q, onClaim }: { q: RequirementState; onClaim: (k: ClaimKind) => void }) {
  const target = q.target ?? 1;
  const pct = Math.min(100, Math.round((Math.min(q.have, target) / target) * 100));
  return (
    <li className={`jr-req${q.done ? ' is-done' : ''}`}>
      <span className="jr-req-mark" aria-hidden>
        {q.done ? <Icon name="check" /> : q.claimStatus === 'pending' ? <Icon name="clock" /> : null}
      </span>
      <div className="jr-req-body">
        <div className="jr-req-top">
          <b>{q.label}</b>
          {q.claim ? (
            <span className={`ps2-pill jr-st is-${q.claimStatus ?? 'none'}`}>
              {q.claimStatus ? CLAIM_STATUS[q.claimStatus] : 'Belum diajukan'}
            </span>
          ) : (
            <span className="jr-req-count">
              {Math.min(q.have, target)} / {target} {q.unit}
            </span>
          )}
        </div>
        {!q.claim && target > 1 && (
          <div className="ps2-bar" role="progressbar" aria-label={q.label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(q.have, target)}>
            <span style={{ width: `${pct}%` }} />
          </div>
        )}
        {!q.done && (
          <div className="jr-req-act">
            {q.claim && q.claimStatus !== 'pending' && (
              <button type="button" className="ui-btn ui-btn-primary ps2-btn-sm" onClick={() => onClaim(q.claim!)}>
                {q.claimStatus === 'rejected' ? 'Ajukan ulang' : 'Ajukan verifikasi'}
              </button>
            )}
            {q.href && q.cta && (
              <Link className="ui-btn ui-btn-ghost ps2-btn-sm" href={q.href}>
                {q.cta}
                <Icon name="arrow" />
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/* ---------- formulir pengajuan ---------- */

function ClaimDialog({ kind, onClose, onDone }: { kind: ClaimKind; onClose: () => void; onDone: () => void }) {
  const { repo } = usePassport();
  const toast = useToast();
  const info = CLAIM_INFO[kind];
  const tahap = STAGE_RULES[info.stage];
  const [detail, setDetail] = useState('');
  const [url, setUrl] = useState('');
  const [valuasi, setValuasi] = useState('');
  const [setuju, setSetuju] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const angkaValuasi = Number(valuasi.replace(/\D/g, '')) || 0;

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setGalat(null);
    if (detail.trim().length < 10) return setGalat('Keterangan minimal 10 karakter.');
    if (kind === 'founder' && angkaValuasi <= 100_000_000) return setGalat('Valuasi bisnis harus di atas Rp100.000.000.');
    if (!setuju) return setGalat('Centang pernyataan bahwa data yang Anda kirim benar.');
    setSibuk(true);
    try {
      await repo.submitClaim({ kind, detail, url: url.trim() || null, valuation: kind === 'founder' ? angkaValuasi : null });
      toast('Pengajuan terkirim. Tim Catalyst akan memeriksanya dalam 1–3 hari kerja.');
      onDone();
    } catch (err) {
      setGalat(errMsg(err, 'Gagal mengirim pengajuan.'));
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={info.title} width={640} dismissible={!sibuk}>
      <form className="ui-form cl-form" onSubmit={(e) => void kirim(e)}>
        <div className="cl-intro">
          <span className="cl-ico" aria-hidden>
            <Icon name={`j-${info.stage}`} />
          </span>
          <div>
            <b>
              Syarat tahap {tahap.name}
              {tahap.exclusive && <span className="jg-tag is-gold">Akses eksklusif</span>}
            </b>
            <p>
              {tahap.about} Setelah diterima, tahapnya terbuka otomatis begitu tahap sebelumnya terpenuhi, dengan hadiah +{tahap.points} poin
              CATA{tahap.perk ? ` dan ${tahap.perk}` : ''}.
            </p>
          </div>
        </div>

        <div className="cl-grid">
          <section className="cl-box">
            <h4>Yang perlu disiapkan</h4>
            <ul>
              {info.checklist.map((c) => (
                <li key={c}>
                  <Icon name="check" />
                  {c}
                </li>
              ))}
            </ul>
          </section>
          <section className="cl-box">
            <h4>Proses pemeriksaan</h4>
            <ol>
              <li>Pengajuan masuk antrean tim Catalyst.</li>
              <li>Tim memeriksa dalam 1–3 hari kerja dan bisa menghubungi Anda bila perlu.</li>
              <li>Status tampil di Pengajuan saya. Bila ditolak, ada catatan dan Anda bisa mengajukan ulang.</li>
            </ol>
          </section>
        </div>

        <TextArea
          label="Keterangan"
          hint={
            <>
              {info.hint} Contoh: <i>{info.example}</i>
            </>
          }
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={800}
          counter
          rows={4}
          data-autofocus
          required
        />
        {kind === 'founder' && (
          <TextField
            label="Valuasi bisnis (rupiah)"
            hint={angkaValuasi ? rp(angkaValuasi) : 'Wajib di atas Rp100.000.000'}
            value={valuasi}
            inputMode="numeric"
            onChange={(e) => setValuasi(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="250.000.000"
            required
          />
        )}
        <TextField label={info.urlLabel} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" maxLength={500} />

        <label className="cl-agree">
          <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
          <span>Saya menyatakan data yang saya kirim benar dan bersedia dihubungi tim Catalyst untuk verifikasi lanjutan.</span>
        </label>
        <FormError message={galat} />
        <div className="ui-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose} disabled={sibuk}>
            Batal
          </button>
          <SubmitButton busy={sibuk}>Kirim pengajuan</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
