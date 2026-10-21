'use client';

import { useId, useState } from 'react';
import { fmtDate, fmtDayMonth, fmtNumber, fmtPoints } from '@/components/passport/sections/common';
import { reasonLabel } from '@/components/passport/sections/labels';
import type { PointEvent } from '@/lib/types';
import { DataTable } from './DataTable';
import { niceTicks, useWidth } from './scale';

const H = 200;
const M = { top: 14, right: 12, bottom: 26, left: 40 };
const DAY = 86_400_000;

interface Step {
  t: number;
  total: number;
}

/**
 * Saldo CATA kumulatif sebagai garis bertangga: poin bertambah seketika
 * saat diberikan, bukan naik perlahan di antara dua kejadian.
 */
export function PointsChart({ events }: { events: PointEvent[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const titleId = useId();
  const descId = useId();
  // Waktu dibekukan saat grafik dipasang supaya render tetap murni.
  const [now] = useState(() => Date.now());

  const sorted = [...events]
    .map((e) => ({ ...e, t: new Date(e.createdAt).getTime() }))
    .filter((e) => Number.isFinite(e.t))
    .sort((a, b) => a.t - b.t);

  // Kejadian pada detik yang sama (misalnya poin daftar dan profil lengkap) digabung jadi satu titik.
  const steps: Step[] = [];
  let run = 0;
  for (const e of sorted) {
    run += e.delta;
    const last = steps[steps.length - 1];
    if (last && last.t === e.t) last.total = run;
    else steps.push({ t: e.t, total: run });
  }
  if (steps.length === 0) return null;

  const t1 = Math.max(now, steps[steps.length - 1].t);
  const t0 = Math.min(steps[0].t, t1 - DAY);
  const max = steps.reduce((m, s) => Math.max(m, s.total), 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const innerW = width - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const x = (t: number) => M.left + ((t - t0) / (t1 - t0)) * innerW;
  const y = (v: number) => M.top + innerH - (Math.max(0, v) / top) * innerH;

  let d = `M${x(steps[0].t).toFixed(1)},${y(0).toFixed(1)}`;
  for (const s of steps) d += `H${x(s.t).toFixed(1)}V${y(s.total).toFixed(1)}`;
  d += `H${x(t1).toFixed(1)}`;
  const area = `${d}V${y(0).toFixed(1)}Z`;

  const first = steps[0];
  const final = steps[steps.length - 1];
  const mid = t0 + (t1 - t0) / 2;

  return (
    <div className="ps2-chart" ref={ref}>
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
        <title id={titleId}>Poin CATA kumulatif</title>
        <desc id={descId}>
          {`Dari 0 menjadi ${fmtNumber(final.total)} poin sejak ${fmtDate(new Date(first.t).toISOString())}, dalam ${events.length} kejadian.`}
        </desc>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'ps2-axis' : 'ps2-grid'} x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {fmtNumber(t)}
            </text>
          </g>
        ))}
        <path className="ps2-area" d={area} />
        <path className="ps2-line" d={d} pathLength={1} />
        {steps.map((s) => (
          <circle key={s.t} className="ps2-dot" cx={x(s.t)} cy={y(s.total)} r={3.5}>
            <title>{`${fmtDate(new Date(s.t).toISOString())}: ${fmtNumber(s.total)} poin`}</title>
          </circle>
        ))}
        <text x={M.left} y={H - 8} textAnchor="start">
          {fmtDayMonth(new Date(t0))}
        </text>
        {width >= 420 && (
          <text x={x(mid)} y={H - 8} textAnchor="middle">
            {fmtDayMonth(new Date(mid))}
          </text>
        )}
        <text x={width - M.right} y={H - 8} textAnchor="end">
          Hari ini
        </text>
      </svg>
      <DataTable
        caption="Riwayat poin CATA kumulatif"
        head={['Tanggal', 'Alasan', 'Perubahan', 'Saldo']}
        rows={sorted
          .reduce<{ rows: (string | number)[][]; sum: number }>(
            (acc, e) => {
              acc.sum += e.delta;
              acc.rows.push([fmtDate(e.createdAt), reasonLabel(e.reason), fmtPoints(e.delta), fmtNumber(acc.sum)]);
              return acc;
            },
            { rows: [], sum: 0 },
          )
          .rows.reverse()}
      />
    </div>
  );
}
