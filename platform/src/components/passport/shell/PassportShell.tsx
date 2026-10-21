'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { useToast } from '@/components/ui/Toast';
import { ValueStrip } from '../cards/RailCards';
import { CelebrationProvider } from '../journey/Celebration';
import { FeedbackDialog } from './FeedbackDialog';
import { ADMIN_EMAIL } from '@/lib/env';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * Rangka Passport: sidebar, bilah atas, isi, dan pita nilai.
 *
 * Isi halaman baru dirender sesudah profil termuat. Halaman di bawahnya
 * boleh menganggap usePassport().profile ada, jadi tidak ada satu pun
 * yang perlu menangani keadaan "belum dimuat" sendiri.
 */
export function PassportShell({ children }: { children: ReactNode }) {
  const { profile, loading, error, reload, signOut, repo, user } = usePassport();
  const toast = useToast();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [keluar, setKeluar] = useState(false);
  const side = useRef<HTMLElement>(null);
  const work = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLElement | null>(null);
  // Di bawah 1040px sidebar menjadi laci.
  const [laci, setLaci] = useState(false);
  const [masukan, setMasukan] = useState(false);

  const tutup = useCallback(() => setOpen(false), []);

  // Laci ditutup setiap kali halaman berganti.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [path]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1040px)');
    const ukur = () => setLaci(mq.matches);
    ukur();
    mq.addEventListener('change', ukur);
    return () => mq.removeEventListener('change', ukur);
  }, []);

  // Laci tertutup keluar dari urutan Tab dan pembaca layar; laci terbuka
  // membuat sisa halaman inert, jadi fokus tidak lolos ke balik tirai.
  // Efek ini sengaja di atas efek fokus di bawah, supaya inert sudah
  // dilepas sebelum fokus dipindah ke laci.
  useEffect(() => {
    if (side.current) side.current.inert = laci && !open;
    if (work.current) work.current.inert = laci && open;
  }, [laci, open]);

  // Laci terbuka: gulir halaman dikunci, fokus pindah ke laci, Escape menutup,
  // dan fokus kembali ke tombol burger sesudah ditutup.
  useEffect(() => {
    if (!open) return;
    const kerja = work.current;
    burger.current = document.activeElement as HTMLElement | null;
    document.body.classList.add('locked');
    side.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => {
      document.body.classList.remove('locked');
      document.removeEventListener('keydown', esc);
      // Pembersihan ini berjalan sebelum efek inert di atas, jadi inert
      // dilepas lebih dulu di sini; elemen inert tidak bisa menerima fokus.
      if (kerja) kerja.inert = false;
      burger.current?.focus();
    };
  }, [open]);

  async function onSignOut() {
    setKeluar(true);
    try {
      await signOut();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal keluar.', 'error');
      setKeluar(false);
    }
  }

  let isi: ReactNode;
  if (loading) {
    isi = (
      <div className="pass-loading" aria-busy="true" aria-label="Memuat Passport">
        <div className="ui-skeleton" style={{ height: 300, borderRadius: 16 }} />
        <div className="ui-skeleton" style={{ height: 140 }} />
        <div className="ui-skeleton" style={{ height: 180 }} />
      </div>
    );
  } else if (error) {
    isi = (
      <div className="ui-empty pass-state" role="alert">
        <b>Passport tidak bisa dimuat</b>
        <p>{error}</p>
        <button type="button" className="ui-btn ui-btn-primary" onClick={() => void reload()}>
          Coba lagi
        </button>
      </div>
    );
  } else if (!profile && user?.email?.toLowerCase() === ADMIN_EMAIL) {
    // Akun admin sengaja tidak punya Passport; tempatnya di dashboard admin.
    isi = (
      <div className="ui-empty pass-state" role="status">
        <b>Ini akun admin Catalyst</b>
        <p>Akun admin tidak memiliki Catalyst Passport. Buka dashboard admin untuk memantau anggota.</p>
        <a className="ui-btn ui-btn-primary" href="/bp/admin/">
          Buka dashboard admin
        </a>
      </div>
    );
  } else if (!profile) {
    isi = (
      <div className="ui-empty pass-state" role="alert">
        <b>Profil Anda belum dibuat</b>
        <p>
          Profil semestinya dibuat otomatis saat mendaftar. Bila pesan ini tetap muncul, pastikan berkas
          supabase/migrations/0001_init.sql sudah dijalankan di project Supabase.
        </p>
        <button type="button" className="ui-btn ui-btn-primary" onClick={() => void reload()}>
          Muat ulang
        </button>
      </div>
    );
  } else {
    isi = <CelebrationProvider>{children}</CelebrationProvider>;
  }

  return (
    <div className="pass-shell">
      <Sidebar
        ref={side}
        open={open}
        onNavigate={tutup}
        onSignOut={onSignOut}
        signingOut={keluar}
        onFeedback={() => {
          setOpen(false);
          setMasukan(true);
        }}
      />
      {masukan && <FeedbackDialog onClose={() => setMasukan(false)} />}
      <div className={`pass-scrim${open ? ' on' : ''}`} aria-hidden onClick={tutup} />
      <div className="pass-work" ref={work}>
        <Topbar profile={profile} demo={repo.mode === 'demo'} menuOpen={open} onMenu={() => setOpen((o) => !o)} />
        <main className="pass-main" id="pass-main">
          {isi}
        </main>
        <ValueStrip />
      </div>
    </div>
  );
}
