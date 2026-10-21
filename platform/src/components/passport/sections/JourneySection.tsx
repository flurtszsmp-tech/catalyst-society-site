'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { STAGES, type JourneyEvent, type Stage } from '@/lib/types';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHead,
  SessionGate,
  Skeleton,
  fmtDate,
  fmtNumber,
  fmtPoints,
  useLoad,
} from './common';
import { STAGE_INFO, reasonLabel } from './labels';

type StageState = 'done' | 'current' | 'open' | 'goal' | 'locked';

const STATE_LABEL: Record<StageState, string> = {
  done: 'Tercapai',
  current: 'Tahap saat ini',
  open: 'Masih bisa diraih',
  goal: 'Tujuan berikutnya',
  locked: 'Belum terbuka',
};

interface JourneyData {
  events: JourneyEvent[];
  communities: number;
  projects: number;
}

export function JourneySection() {
  const { repo, user, profile, loading, error, reload } = usePassport();
  const uid = user?.id ?? null;

  const loadJourney = useMemo(
    () =>
      uid
        ? async (): Promise<JourneyData> => {
            const [events, communities, projects] = await Promise.all([
              repo.listJourney(uid),
              repo.listCommunities(uid),
              repo.listProjects(uid),
            ]);
            return { events, communities: communities.length, projects: projects.length };
          }
        : null,
    [repo, uid],
  );
  const loadPoints = useMemo(() => (uid ? () => repo.listMyPointEvents() : null), [repo, uid]);

  const journey = useLoad(loadJourney);
  const points = useLoad(loadPoints);
  // Repo mengurutkan dari yang terlama; riwayat dibaca dari yang terbaru. Baris
  // bernilai 0 (misalnya pencatatan lencana Builder) tidak mengubah saldo, jadi disembunyikan.
  const history = useMemo(() => (points.data ?? []).filter((p) => p.delta !== 0).reverse(), [points.data]);

  return (
    <div className="ps2">
      <PageHead
        title="Journey"
        lead="Enam tahap perjalanan Anda di Catalyst Society, dari bergabung sampai menjadi Innovator."
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
                <StageTrack current={profile.journeyStage} data={journey.data} />
              )}
            </Card>

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
                  Poin CATA muncul di sini saat Anda bergabung ke komunitas, menambah projek, atau melengkapi profil.
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
          </>
        )}
      </SessionGate>
    </div>
  );
}

function StageTrack({ current, data }: { current: Stage; data: JourneyData }) {
  const reached = new Map(data.events.map((e) => [e.stage, e]));
  const currentIdx = Math.max(0, STAGES.indexOf(current));
  const next = STAGES[currentIdx + 1] as Stage | undefined;

  const stateOf = (s: Stage, i: number): StageState => {
    if (i === currentIdx) return 'current';
    if (i === currentIdx + 1) return 'goal';
    if (i < currentIdx) {
      // Builder bisa diraih sebelum Connector. Database tetap mencatat
      // Connector saat komunitas ketiga ditambahkan, jadi tahap yang
      // terlewati tapi bisa diraih sendiri ditandai masih terbuka.
      if (!reached.has(s) && STAGE_INFO[s].target) return 'open';
      return 'done';
    }
    return 'locked';
  };

  const openStages = STAGES.filter((s, i) => stateOf(s, i) === 'open');

  return (
    <div className="ps2-goal">
      <ol className="ps2-stages" aria-label="Enam tahap Journey">
        {STAGES.map((s, i) => {
          const st = stateOf(s, i);
          const ev = reached.get(s);
          const info = STAGE_INFO[s];
          return (
            <li key={s} className={`ps2-stage is-${st}`} aria-current={st === 'current' ? 'step' : undefined}>
              <Icon name={`j-${s}`} className="ps2-stage-ico" />
              <span className="ps2-stage-state">{STATE_LABEL[st]}</span>
              <b>
                {i + 1}. {info.name}
              </b>
              <small>{info.summary}</small>
              {ev && (
                <small>
                  <time dateTime={ev.occurredAt}>{fmtDate(ev.occurredAt)}</time>
                </small>
              )}
            </li>
          );
        })}
      </ol>

      {next ? (
        <GoalPanel stage={next} data={data} />
      ) : (
        <p className="ps2-note">Anda sudah berada di tahap tertinggi, Innovator. Terima kasih sudah berkarya bersama Catalyst.</p>
      )}

      {openStages.map((s) => (
        <p key={s} className="ps2-note">
          {STAGE_INFO[s].name} belum tercatat. {STAGE_INFO[s].how}{' '}
          {STAGE_INFO[s].href && (
            <Link className="ps2-link" href={STAGE_INFO[s].href}>
              {STAGE_INFO[s].cta}
            </Link>
          )}
        </p>
      ))}
    </div>
  );
}

function GoalPanel({ stage, data }: { stage: Stage; data: JourneyData }) {
  const info = STAGE_INFO[stage];
  const have = stage === 'connector' ? data.communities : stage === 'builder' ? data.projects : null;
  const pct = info.target && have !== null ? Math.min(100, Math.round((have / info.target) * 100)) : null;

  return (
    <div className="ps2-card" style={{ margin: 0 }}>
      <p className="ps2-kicker">Tujuan berikutnya</p>
      <div className="ps2-goal">
        <h3>{info.name}</h3>
        <p>{info.how}</p>
        {pct !== null && info.target && have !== null && (
          <div>
            <div className="ps2-goal-meta">
              <span>Kemajuan</span>
              <span>
                {Math.min(have, info.target)} dari {info.target} {info.unit}
              </span>
            </div>
            <div
              className="ps2-bar"
              role="progressbar"
              aria-label={`Kemajuan menuju ${info.name}`}
              aria-valuemin={0}
              aria-valuemax={info.target}
              aria-valuenow={Math.min(have, info.target)}
              style={{ marginTop: 6 }}
            >
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        {info.href && info.cta && (
          <div>
            <Link className="ui-btn ui-btn-primary" href={info.href}>
              {info.cta}
              <Icon name="arrow" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
