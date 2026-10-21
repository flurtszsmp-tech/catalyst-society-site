'use client';

import type { ReactNode } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { FormError } from '@/components/ui/form';
import type { Profile } from '@/lib/types';

/** Judul halaman di dalam rangka Passport. */
export function PageHead({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className="pf-head">
      <div>
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </div>
      {children && <div className="pf-head-act">{children}</div>}
    </header>
  );
}

/**
 * Merender isi hanya sesudah profil dimuat. Formulir di bawahnya
 * mengambil nilai awal dari profil, jadi tidak boleh dirender lebih dulu
 * dengan data kosong lalu tertimpa.
 */
export function WithProfile({ children }: { children: (p: Profile) => ReactNode }) {
  const { profile, loading, error, reload } = usePassport();

  if (loading) {
    return (
      <div className="pf-loading" role="status">
        <span className="sr-only">Memuat profil…</span>
        <div className="ui-skeleton pf-skel" aria-hidden />
        <div className="ui-skeleton pf-skel pf-skel-lg" aria-hidden />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <section className="pf-card">
        <FormError message={error ?? 'Profil belum terbentuk. Muat ulang halaman ini sebentar lagi.'} />
        <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void reload()}>
          Coba lagi
        </button>
      </section>
    );
  }

  return <>{children(profile)}</>;
}
