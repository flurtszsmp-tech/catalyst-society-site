'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { PointsChart } from '@/components/passport/charts/PointsChart';
import { ReasonBars } from '@/components/passport/charts/ReasonBars';
import { ViewsChart } from '@/components/passport/charts/ViewsChart';
import { usePassport } from '@/components/passport/PassportProvider';
import type { DailyCount } from '@/lib/types';
import { Card, EmptyState, ErrorState, PageHead, SessionGate, Skeleton, fmtNumber, useLoad } from './common';

const DAYS = 30;

function sortByDate(d: DailyCount[]): DailyCount[] {
  return [...d].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function AnalyticsSection() {
  const { repo, user, profile, loading, error, reload } = usePassport();
  const uid = user?.id ?? null;
  const loadViews = useMemo(
    () => (uid ? async () => sortByDate(await repo.getProfileViews(DAYS)) : null),
    [repo, uid],
  );
  const loadPoints = useMemo(() => (uid ? () => repo.listMyPointEvents() : null), [repo, uid]);
  const views = useLoad(loadViews);
  const points = useLoad(loadPoints);

  const sum = (d: DailyCount[]) => d.reduce((s, x) => s + x.count, 0);
  const total30 = views.data ? sum(views.data) : 0;
  const total7 = views.data ? sum(views.data.slice(-7)) : 0;

  return (
    <div className="ps2">
      <PageHead
        title="Analitik"
        lead="Seberapa sering Passport publik Anda dilihat, dan dari mana poin CATA Anda berasal."
      />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        {profile && !profile.isPublic && (
          <p className="ps2-note">
            Passport Anda sedang privat, jadi kunjungan baru tidak tercatat.{' '}
            <Link className="ps2-link" href="/passport/settings">
              Buka Pengaturan
            </Link>{' '}
            untuk menjadikannya publik.
          </p>
        )}

        <Card id="ps2-views-title" title={`Kunjungan profil, ${DAYS} hari terakhir`}>
          {views.error ? (
            <ErrorState message={views.error} onRetry={views.retry} />
          ) : !views.data ? (
            <Skeleton rows={1} height={260} label="Memuat kunjungan profil…" />
          ) : (
            <>
              <div className="ps2-stats" style={{ marginBottom: 16 }}>
                <div className="ps2-stat">
                  <small>7 hari terakhir</small>
                  <b>{fmtNumber(total7)}</b>
                </div>
                <div className="ps2-stat">
                  <small>{DAYS} hari terakhir</small>
                  <b>{fmtNumber(total30)}</b>
                </div>
                <div className="ps2-stat">
                  <small>Rata-rata per hari</small>
                  <b>{(total30 / Math.max(1, views.data.length)).toLocaleString('id-ID', { maximumFractionDigits: 1 })}</b>
                </div>
              </div>
              {total30 === 0 ? (
                <EmptyState icon="chart" title="Belum ada kunjungan">
                  Bagikan tautan Passport publik Anda. Setiap kunjungan dari orang lain akan tercatat di sini per hari.
                </EmptyState>
              ) : (
                <ViewsChart data={views.data} />
              )}
            </>
          )}
        </Card>

        <div className="ps2-grid-2">
          <Card
            id="ps2-cumul-title"
            title="Poin CATA dari waktu ke waktu"
            aside={
              profile ? (
                <p className="ps2-total">
                  Saldo <b>{fmtNumber(profile.cataPoints)} poin</b>
                </p>
              ) : undefined
            }
          >
            {points.error ? (
              <ErrorState message={points.error} onRetry={points.retry} />
            ) : !points.data ? (
              <Skeleton rows={1} height={240} label="Memuat riwayat poin…" />
            ) : points.data.length === 0 ? (
              <EmptyState icon="spark" title="Belum ada poin">
                Poin CATA bertambah saat Anda bergabung ke komunitas, menambah projek, atau melengkapi profil.
              </EmptyState>
            ) : (
              <PointsChart events={points.data} />
            )}
          </Card>

          <Card id="ps2-reason-title" title="Poin menurut sumber">
            {points.error ? (
              <ErrorState message={points.error} onRetry={points.retry} />
            ) : !points.data ? (
              <Skeleton rows={4} height={32} label="Memuat sumber poin…" />
            ) : points.data.every((p) => p.delta === 0) ? (
              <EmptyState icon="spark" title="Belum ada sumber poin">
                Rincian sumber poin muncul setelah Anda mendapat poin pertama.
              </EmptyState>
            ) : (
              <ReasonBars events={points.data} />
            )}
          </Card>
        </div>
      </SessionGate>
    </div>
  );
}
