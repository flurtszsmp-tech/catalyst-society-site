import { fmtNumber } from '@/components/passport/sections/common';
import { reasonLabel } from '@/components/passport/sections/labels';
import type { PointEvent } from '@/lib/types';

/**
 * Jumlah poin per alasan sebagai bilah mendatar. Angkanya ditulis di
 * samping bilah, jadi bilah sendiri disembunyikan dari pembaca layar.
 */
export function ReasonBars({ events }: { events: PointEvent[] }) {
  const sums = new Map<string, number>();
  for (const e of events) {
    // Dikelompokkan menurut label, jadi alasan yang belum dikenal menyatu di "Aktivitas lainnya".
    const k = reasonLabel(e.reason);
    sums.set(k, (sums.get(k) ?? 0) + e.delta);
  }
  const rows = [...sums.entries()].filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]);
  const max = rows.reduce((m, [, v]) => Math.max(m, Math.abs(v)), 0) || 1;

  if (rows.length === 0) return null;
  return (
    <ul className="ps2-reasons">
      {rows.map(([label, v]) => (
        <li key={label}>
          <span>{label}</span>
          <b>{fmtNumber(v)} poin</b>
          <div className="ps2-bar" aria-hidden>
            <span style={{ width: `${Math.max(2, (Math.abs(v) / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
