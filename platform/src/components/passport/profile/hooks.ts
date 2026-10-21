'use client';

/* ===========================================================
   Kait bersama halaman Profil, Skills & Roles, dan Settings.
   =========================================================== */
import { useCallback, useEffect, useRef } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { useToast } from '@/components/ui/Toast';
import type { Profile } from '@/lib/types';

/** Pesan galat yang siap tampil. RepoError sudah berbahasa Indonesia. */
export function errorText(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

/** Syarat yang sama dengan pemicu profile_edited di SQL dan DemoRepo. */
export function isProfileComplete(
  p: Pick<Profile, 'avatarPath' | 'avatarUrl' | 'headline' | 'about' | 'skills'>,
): boolean {
  return !!(p.avatarPath || p.avatarUrl) && !!p.headline?.trim() && !!p.about?.trim() && p.skills.length >= 3;
}

/**
 * Dipanggil sesudah menyimpan. Bila profil baru saja menjadi lengkap,
 * profil dimuat ulang dan poin yang didapat diumumkan. Mengembalikan
 * jumlah poin baru (0 bila tidak ada).
 */
export function useCompletionReward() {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  return useCallback(
    async (before: Profile, after: Profile): Promise<number> => {
      if (isProfileComplete(before) || !isProfileComplete(after)) return 0;
      try {
        // Di Supabase poin diberikan pemicu AFTER UPDATE, jadi baris yang
        // dikembalikan oleh penyimpanan belum memuat cata_points terbaru.
        const fresh = await repo.getMyProfile();
        if (!fresh) return 0;
        setProfile(fresh);
        const naik = fresh.cataPoints - before.cataPoints;
        if (naik > 0) toast(`Profil lengkap. +${naik} CATA points`, 'ok');
        return Math.max(0, naik);
      } catch {
        return 0;
      }
    },
    [repo, setProfile, toast],
  );
}

/**
 * Memperingatkan sebelum meninggalkan halaman dengan perubahan yang
 * belum disimpan. beforeunload hanya menangkap muat ulang dan tutup tab;
 * navigasi App Router lewat <Link> tidak memicunya, jadi klik tautan
 * internal dicegat juga di fase capture sebelum sampai ke React.
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const pesan = 'Perubahan belum disimpan. Tinggalkan halaman ini?';

    function sebelumTutup(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Chrome versi lama masih membutuhkan returnValue terisi.
      e.returnValue = '';
    }

    function klik(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const tujuan = new URL(a.href, location.href);
      if (tujuan.origin !== location.origin) return;
      if (tujuan.pathname === location.pathname && tujuan.search === location.search) return;
      if (!window.confirm(pesan)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener('beforeunload', sebelumTutup);
    document.addEventListener('click', klik, true);
    return () => {
      window.removeEventListener('beforeunload', sebelumTutup);
      document.removeEventListener('click', klik, true);
    };
  }, [dirty]);
}

/**
 * Dialog di area ini dipasang hanya saat terbuka, karena Modal memakai
 * id judul yang tetap dan dua dialog tertutup di DOM akan berbagi id.
 * Akibatnya fokus tidak dikembalikan otomatis oleh <dialog>; kait ini
 * yang mengembalikannya ke tombol pembuka.
 */
export function useReturnFocus() {
  const asal = useRef<HTMLElement | null>(null);
  const remember = useCallback(() => {
    asal.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, []);
  const restore = useCallback(() => {
    const el = asal.current;
    asal.current = null;
    if (el) requestAnimationFrame(() => el.isConnected && el.focus());
  }, []);
  return { remember, restore };
}
