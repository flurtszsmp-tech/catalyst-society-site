'use client';

import { useId } from 'react';
import { fmtDate, fmtDayMonth, fmtNumber, parseDay } from '@/components/passport/sections/common';
import type { DailyCount } from '@/lib/types';
import { DataTable } from './DataTable';
import { niceTicks, useWidth } from './scale';

const H = 200;
const M = { top: 12, right: 8, bottom: 26, left: 34 };

/** Kolom kunjungan profil per hari. data diurutkan dari hari terlama. */
export function ViewsChart({ data }: { data: DailyCount[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const titleId = useId();
  const descId = useId();

  const n = Math.max(1, data.length);
  const max = data.reduce((m, d) => Math.max(m, d.count), 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const innerW = width - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const slot = innerW / n;
  const barW = Math.max(2, Math.min(18, slot * 0.66));
  const y = (v: number) => M.top + innerH - (v / top) * innerH;

  const total = data.reduce((s, d) => s + d.count, 0);
  const peak = data.reduce<DailyCount | null>((p, d) => (!p || d.count > p.count ? d : p), null);
  // Label tanggal tiap tujuh hari, dihitung dari hari ini ke belakang supaya hari ini selalu berlabel.
  const labelEvery = width < 420 ? 10 : 7;

  return (
    <div className="ps2-chart" ref={ref}>
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
        <title id={titleId}>{`Kunjungan profil per hari, ${data.length} hari terakhir`}</title>
        <desc id={descId}>
          {`Total ${fmtNumber(total)} kunjungan.`}
          {peak && peak.count > 0 ? ` Tertinggi ${fmtNumber(peak.count)} pada ${fmtDate(peak.date)}.` : ''}
        </desc>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'ps2-axis' : 'ps2-grid'} x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {fmtNumber(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = M.left + slot * i + slot / 2;
          const h = d.count > 0 ? Math.max(2, y(0) - y(d.count)) : 2;
          const day = parseDay(d.date);
          const fromEnd = data.length - 1 - i;
          return (
            <g key={d.date}>
              <title>{`${fmtDate(d.date)}: ${fmtNumber(d.count)} kunjungan`}</title>
              <rect className="ps2-col-hit" x={M.left + slot * i} y={M.top} width={slot} height={innerH} />
              <rect
                className={d.count > 0 ? 'ps2-col' : 'ps2-col-zero'}
                x={cx - barW / 2}
                y={y(0) - h}
                width={barW}
                height={h}
                rx={Math.min(3, barW / 2)}
                style={{ animationDelay: `${Math.min(i * 12, 360)}ms` }}
              />
              {day && fromEnd % labelEvery === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle">
                  {fromEnd === 0 ? 'Hari ini' : fmtDayMonth(day)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <DataTable
        caption="Kunjungan profil per hari"
        head={['Tanggal', 'Kunjungan']}
        rows={[...data].reverse().map((d) => [fmtDate(d.date), fmtNumber(d.count)])}
      />
    </div>
  );
}
