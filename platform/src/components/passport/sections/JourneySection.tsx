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
  pending: 'Menunggu pemeriksaan tim',
  approved: 'Diterima',
  rejected: 'Ditolak',
};

/** Cara mendapat poin CATA. Harus sama dengan private.give_points di 0002_journey_v2.sql. */
const CARA_POIN = [
  { label: 'Membuat Catalyst Passport', poin: '+10' },
  { label: 'Melengkapi profil: foto, headline, tentang, dan tiga keahlian', poin: '+20' },
  { label: 'Komunitas yang diverifikasi tim (maks. 10 komunitas)', poin: '+5 / komunitas' },
  { label: 'Projek pertama', poin: '+15' },
  { label: 'Sertifikat yang diverifikasi tim (maks. 10 sertifikat)', poin: '+25 / sertifikat' },
  { label: 'Naik tahap Journey', poin: '+25 sampai +300' },
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
        lead="Tujuh tahap perjalanan Anda di Catalyst Society, dari Explorer sampai Founder. Tiap tahap membuka tahap berikutnya."
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
                <StageTrack
                  current={profile.journeyStage}
                  data={journey.data}
                  onOpen={openStage}
                  onClaim={setAjukan}
                />
              )}
            </Card>

            <Card id="ps2-about-title" title="Tentang Journey">
              <div className="jr-about">
                <p>
                  Journey mencatat apa yang sudah Anda <b>lakukan</b> di ekosistem Catalyst, bukan seberapa sering Anda membuka aplikasi.
                  Tahap naik berurutan dan tidak pernah turun. Syarat yang terjadi di luar Passport, seperti bootcamp, Catalyst Finder,
                  Catalyst Labs, dan valuasi bisnis, diperiksa langsung oleh tim Catalyst.
                </p>
                <p>
                  <b>Poin CATA terpisah dari Journey.</b> Poin tidak menaikkan tahap; poin ditukar dengan merchandise, akses event, dan
                  program Catalyst. Karena itu poin hanya diberikan untuk hal yang sudah diperiksa, dan setiap alasan hanya dihadiahkan sekali.
                </p>
              </div>
              <ol className="jr-detail">
                {STAGES.map((s, i) => {
                  const r = STAGE_RULES[s];
                  return (
                    <li key={s} className={r.exclusive ? 'is-exclusive' : undefined}>
                      <span className="jr-n">{i + 1}</span>
                      <Icon name={`j-${s}`} className="jr-ico" />
                      <div>
                        <b>
                          {r.name}
                          {r.exclusive && <span className="ps2-pill">Akses eksklusif</span>}
                        </b>
                        <p>{r.about}</p>
                        <ul>
                          {(journey.data ? requirementStates(s, journey.data.progress) : (r.requirements as RequirementState[])).map((q) => {
                            const st = journey.data ? q.claimStatus : undefined;
                            return (
                              <li key={q.key}>
                                {q.label}
                                {q.target && q.target > 1 ? ` (${q.target} ${q.unit})` : ''}
                                {q.claim && <em> · diverifikasi tim</em>}
                                {/* Pengajuan boleh dikirim kapan saja; tahapnya naik
                                    setelah diterima dan tahap sebelumnya terpenuhi. */}
                                {q.claim && journey.data && (
                                  <span className="jr-claim-inline">
                                    {st ? (
                                      <span className={`ps2-pill jr-st is-${st}`}>{CLAIM_STATUS[st]}</span>
                                    ) : null}
                                    {(!st || st === 'rejected') && (
                                      <button type="button" className="ps2-link" onClick={() => setAjukan(q.claim!)}>
                                        {st === 'rejected' ? 'Ajukan ulang' : 'Ajukan verifikasi'}
                                      </button>
                                    )}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        {(r.points > 0 || r.perk) && (
                          <small>
                            Hadiah: {r.points > 0 ? `+${r.points} poin CATA` : ''}
                            {r.perk ? `${r.points > 0 ? ' dan ' : ''}${r.perk}` : ''}
                          </small>
                        )}
                      </div>
                    </li>
                  );
                })}
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
                    Poin CATA muncul di sini saat profil Anda lengkap, komunitas Anda diverifikasi, atau Anda naik tahap.
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
                  Mengikuti orang dan menekan Gabung tidak memberi poin. Keluar lalu bergabung lagi ke komunitas yang sama juga tidak.
                </p>
              </Card>
            </div>

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
            <li key={s} className={`ps2-stage is-${st}${r.exclusive ? ' is-exclusive' : ''}`} aria-current={st === 'current' ? 'step' : undefined}>
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

  return (
    <div className="ps2-card jr-goal" style={{ margin: 0 }}>
      <p className="ps2-kicker">Tujuan berikutnya</p>
      <h3>{r.name}</h3>
      <p>{r.about}</p>
      <ul className="jr-reqs">
        {reqs.map((q) => (
          <Requirement key={q.key} q={q} pending={q.key === 'communities' ? data.progress.pendingCommunities : 0} onClaim={onClaim} />
        ))}
      </ul>
      <p className="ps2-sub">
        Hadiah tahap ini: +{r.points} poin CATA{r.perk ? ` dan ${r.perk}` : ''}.
      </p>
    </div>
  );
}

function Requirement({ q, pending, onClaim }: { q: RequirementState; pending: number; onClaim: (k: ClaimKind) => void }) {
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
        {q.key === 'communities' && pending > 0 && (
          <small className="jr-req-hint">{pending} komunitas masih menunggu verifikasi tim.</small>
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

function ClaimDialog({ kind, onClose, onDone }: { kind: ClaimKind; onClose: () => void; onDone: () => void }) {
  const { repo } = usePassport();
  const toast = useToast();
  const info = CLAIM_INFO[kind];
  const [detail, setDetail] = useState('');
  const [url, setUrl] = useState('');
  const [valuasi, setValuasi] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const angkaValuasi = Number(valuasi.replace(/\D/g, '')) || 0;

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setGalat(null);
    if (detail.trim().length < 10) return setGalat('Keterangan minimal 10 karakter.');
    if (kind === 'founder' && angkaValuasi <= 100_000_000) return setGalat('Valuasi bisnis harus di atas Rp100.000.000.');
    setSibuk(true);
    try {
      await repo.submitClaim({ kind, detail, url: url.trim() || null, valuation: kind === 'founder' ? angkaValuasi : null });
      toast('Pengajuan terkirim. Tim Catalyst akan memeriksanya.');
      onDone();
    } catch (err) {
      setGalat(errMsg(err, 'Gagal mengirim pengajuan.'));
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={info.title} width={520} dismissible={!sibuk}>
      <form className="ui-form" onSubmit={(e) => void kirim(e)}>
        <p className="ps2-sub">
          Syarat tahap {STAGE_RULES[info.stage].name}. Tim Catalyst memeriksa setiap pengajuan; tahap naik otomatis setelah diterima dan
          tahap sebelumnya terpenuhi.
        </p>
        <TextArea label="Keterangan" hint={info.hint} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={800} counter rows={4} data-autofocus required />
        {kind === 'founder' && (
          <TextField
            label="Valuasi bisnis (rupiah)"
            hint={angkaValuasi ? rp(angkaValuasi) : 'Minimal di atas Rp100.000.000'}
            value={valuasi}
            inputMode="numeric"
            onChange={(e) => setValuasi(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="250.000.000"
            required
          />
        )}
        <TextField label={info.urlLabel} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" maxLength={500} />
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
