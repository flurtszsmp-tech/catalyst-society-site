'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/env';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { T } from '@/lib/i18n/provider';
import { BrandMark } from '@/components/ui/Icon';
import { LangButtons, LangSwitcher } from '@/components/ui/LangSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export type NavActive = 'home' | 'community' | null;

interface Props {
  active?: NavActive;
  /**
   * true di beranda: tautan bagian memakai jangkar #... di halaman yang
   * sama. false di halaman lain: tautan menuju /#... di beranda.
   */
  onLanding?: boolean;
}

/**
 * Bilah navigasi kaca dan menu burgernya, dipakai beranda dan halaman
 * komunitas.
 *
 * className <nav> sengaja konstan. Kelas .scrolled dipasang imperatif
 * lewat classList, dan beranda memasang .di-gelap dengan cara yang sama.
 * Kalau salah satunya lewat state React, render ulang akan menulis ulang
 * atribut class dan menghapus kelas yang dipasang pihak lain.
 */
export function SiteNav({ active = null, onLanding = false }: Props) {
  const nav = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);
  // Tautan "Masuk" disembunyikan bila sudah ada sesi. Dibaca dari sesi
  // lokal (tanpa panggilan jaringan); ini hanya soal tampilan, penjaga
  // aksesnya tetap proxy.ts dan dal.ts.
  const [masuk, setMasuk] = useState(true);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    let hidup = true;
    void sb.auth.getSession().then(({ data }) => {
      if (hidup && data.session) setMasuk(false);
    });
    const { data } = sb.auth.onAuthStateChange((_e, sesi) => setMasuk(!sesi));
    return () => {
      hidup = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const gulir = () => el.classList.toggle('scrolled', scrollY > 40);
    gulir();
    addEventListener('scroll', gulir, { passive: true });
    return () => removeEventListener('scroll', gulir);
  }, []);

  useEffect(() => {
    // Hanya disentuh saat menu terbuka. Kelas yang sama dipakai loader
    // beranda; kalau dihapus saat mount, gulir loader ikut terbuka.
    if (!menu) return;
    document.body.classList.add('locked');
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('locked');
    };
  }, [menu]);

  const bagian = (id: string) => (onLanding ? `#${id}` : `/#${id}`);
  const tutup = () => setMenu(false);

  const tautan = (
    <>
      <a href="/" className={active === 'home' ? 'aktif' : undefined} onClick={tutup}>
        <T k="nav.home" />
      </a>
      <a href="/#community" className={active === 'community' ? 'aktif' : undefined} onClick={tutup}>
        <T k="nav.community" />
      </a>
      <a href={bagian('programs')} onClick={tutup}>
        <T k="nav.program" />
      </a>
      <a href={bagian('summit')} onClick={tutup}>
        <T k="nav.summit" />
      </a>
      <a href={bagian('ecosystem')} onClick={tutup}>
        <T k="nav.tentang" />
      </a>
    </>
  );

  const passport = (
    <a href="/app.html#passport" className="btn" onClick={tutup}>
      <T k="nav.passport" />
      {!isSupabaseConfigured && (
        <i className="btn-flag">
          <T k="nav.demo" />
        </i>
      )}
    </a>
  );

  return (
    <>
      <div className="top-scrim" aria-hidden />
      <nav className="nav" ref={nav}>
        <a href="/" className="lockup" aria-label="Catalyst Society">
          <BrandMark />
          <span className="word" translate="no">
            <b>CATALYST</b>
            <span>SOCIETY</span>
          </span>
        </a>
        <div className="nav-links">{tautan}</div>
        <div className="nav-right">
          <ThemeToggle />
          <LangSwitcher />
          {masuk && (
            <a href="/login.html" className="nav-masuk">
              <T k="nav.masuk" />
            </a>
          )}
          {passport}
          <button
            type="button"
            className="burger"
            aria-label="Menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`nav-menu${menu ? ' open' : ''}`} aria-hidden={!menu}>
        {tautan}
        {masuk && (
          <a href="/login.html" onClick={tutup}>
            <T k="nav.masuk" />
          </a>
        )}
        {passport}
        <LangButtons />
        <ThemeToggle />
      </div>
    </>
  );
}
