'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { BrandMark, Icon } from '@/components/ui/Icon';

interface Item {
  href: string;
  label: string;
  icon: string;
}

/*
 * Susunan panel mengikuti gambar acuan pertama (kaca bertingkat dengan
 * label kelompok), isinya mengikuti gambar kedua. Sengaja tidak memuat
 * tautan ke program Catalyst (Finder, Academy, Labs, Ventures, Summit):
 * sidebar ini milik profil, bukan peta ekosistem.
 */
const UTAMA: Item[] = [
  { href: '/passport', label: 'Home', icon: 'home' },
  { href: '/passport/profile', label: 'Profile', icon: 'user' },
  { href: '/passport/journey', label: 'Journey', icon: 'journey' },
];
const SHOWCASE: Item[] = [
  { href: '/passport/communities', label: 'Communities', icon: 'users' },
  { href: '/passport/projects', label: 'Projects', icon: 'cube' },
  { href: '/passport/certificates', label: 'Certificates', icon: 'award' },
  { href: '/passport/skills', label: 'Skills & Roles', icon: 'skills' },
];
const GROWTH: Item[] = [
  { href: '/passport/connections', label: 'Connections', icon: 'network' },
  { href: '/passport/analytics', label: 'Analytics', icon: 'chart' },
];

function aktif(path: string, href: string): boolean {
  // Ekspor statis memakai trailingSlash, jadi pathname bisa "/passport/"; samakan dulu.
  const p = path.replace(/\/+$/, '') || '/';
  return href === '/passport' ? p === '/passport' : p === href || p.startsWith(`${href}/`);
}

interface Props {
  open: boolean;
  onNavigate: () => void;
  onSignOut: () => void;
  signingOut: boolean;
  /** Anggota tim Catalyst melihat menu Verifikasi. */
  staff?: boolean;
}

export const Sidebar = forwardRef<HTMLElement, Props>(function Sidebar({ open, onNavigate, onSignOut, signingOut, staff = false }, ref) {
  const path = usePathname() ?? '/passport';
  const navRef = useRef<HTMLElement>(null);
  const pilRef = useRef<HTMLSpanElement>(null);
  const sorot = useRef<HTMLElement | null>(null);

  /* Satu pil hitam untuk seluruh menu: diam di menu aktif, mengikuti kursor saat
     menu lain disentuh, lalu kembali ke menu aktif saat kursor keluar. Posisi
     diukur terhadap <nav>, jadi tetap benar walau sidebar digulir. Transisi CSS
     yang membawanya, sehingga sapuan cepat berbelok halus tanpa patah. */
  const taruh = useCallback(() => {
    const nav = navRef.current, pil = pilRef.current;
    if (!nav || !pil) return;
    const t = sorot.current ?? nav.querySelector<HTMLElement>('a.on');
    nav.querySelectorAll('.di-pil').forEach((e) => e !== t && e.classList.remove('di-pil'));
    if (!t) { pil.style.opacity = '0'; return; }
    t.classList.add('di-pil');
    const awal = !nav.classList.contains('siap');
    if (awal) pil.classList.add('diam');
    const n = nav.getBoundingClientRect(), r = t.getBoundingClientRect();
    pil.style.transform = `translate3d(${r.left - n.left}px,${r.top - n.top}px,0)`;
    pil.style.width = `${r.width}px`;
    pil.style.height = `${r.height}px`;
    pil.style.opacity = '1';
    if (awal) { void pil.offsetWidth; pil.classList.remove('diam'); nav.classList.add('siap'); }
  }, []);

  useLayoutEffect(() => { taruh(); }, [path, taruh]);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => taruh());
    ro.observe(nav);
    return () => ro.disconnect();
  }, [taruh]);

  const menuDari = (el: EventTarget | null) =>
    el instanceof Element ? el.closest<HTMLElement>('.pass-panel a, .pass-panel button') : null;
  const masuk = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const m = menuDari(e.target);
    if (m && m !== sorot.current) { sorot.current = m; taruh(); }
  };
  const keluar = () => { sorot.current = null; taruh(); };
  const fokus = (e: React.FocusEvent) => { const m = menuDari(e.target); if (m) { sorot.current = m; taruh(); } };
  const lepasFokus = (e: React.FocusEvent) => { if (!navRef.current?.contains(e.relatedTarget as Node)) keluar(); };

  const daftar = (items: Item[]) => (
    <ul>
      {items.map((it) => {
        const on = aktif(path, it.href);
        return (
          <li key={it.href}>
            <Link href={it.href} className={on ? 'on' : undefined} aria-current={on ? 'page' : undefined} onClick={onNavigate}>
              <Icon name={it.icon} />
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside className={`pass-side${open ? ' open' : ''}`} id="pass-side" ref={ref} aria-label="Menu Passport" tabIndex={-1}>
      <Link href="/passport" className="pass-brand-pill" onClick={onNavigate} aria-label="Catalyst Passport, Home">
        <BrandMark />
        <span className="word" translate="no">
          <b>CATALYST</b>
          <span>PASSPORT</span>
        </span>
      </Link>

      <nav className="pass-panels" aria-label="Passport" ref={navRef} onPointerOver={masuk} onPointerLeave={keluar} onFocus={fokus} onBlur={lepasFokus}>
        <span className="pass-pil" ref={pilRef} aria-hidden="true" />
        <div className="pass-panel">
          {daftar(UTAMA)}
          <div className="pass-grp" id="grp-showcase">
            Showcase
          </div>
          {daftar(SHOWCASE)}
        </div>

        <div className="pass-panel">
          <div className="pass-grp">Growth</div>
          {daftar(GROWTH)}
        </div>

        {staff && (
          <div className="pass-panel">
            <div className="pass-grp">Tim Catalyst</div>
            {daftar([{ href: '/passport/review', label: 'Verifikasi', icon: 'shield-check' }])}
          </div>
        )}

        <div className="pass-panel pass-panel-foot">
          <ul>
            <li>
              <Link
                href="/passport/settings"
                className={aktif(path, '/passport/settings') ? 'on' : undefined}
                aria-current={aktif(path, '/passport/settings') ? 'page' : undefined}
                onClick={onNavigate}
              >
                <Icon name="settings" />
                Settings
              </Link>
            </li>
            <li>
              <a href="https://www.instagram.com/catalystsociety.id/" target="_blank" rel="noopener noreferrer">
                <Icon name="ig" />
                <span translate="no">catalystsociety.id</span>
              </a>
            </li>
            <li>
              {/* Kembali ke situs utama tanpa keluar: sesi tetap tersimpan di
                  browser, jadi Passport terbuka lagi tanpa masuk ulang. <a>
                  biasa, bukan Link, karena beranda berada di luar basePath /bp. */}
              <a href="/" onClick={onNavigate}>
                <Icon name="back" />
                Back to site
              </a>
            </li>
            <li>
              <button type="button" onClick={onSignOut} disabled={signingOut}>
                <Icon name="logout" />
                {signingOut ? 'Keluar…' : 'Sign out'}
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
});
