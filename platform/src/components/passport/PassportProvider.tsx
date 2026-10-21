'use client';

/* ===========================================================
   Konteks Passport untuk seluruh halaman di bawah /passport.

   Layout memuat sesi dan profil sekali, lalu setiap halaman membaca
   dari sini dan memperbaruinya lewat setProfile sesudah menyimpan,
   supaya bilah atas dan kartu di halaman lain ikut berubah tanpa
   memuat ulang.
   =========================================================== */
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getRepo, type PassportRepo } from '@/lib/repo';
import type { Profile, SessionUser } from '@/lib/types';

interface PassportCtx {
  repo: PassportRepo;
  user: SessionUser | null;
  profile: Profile | null;
  loading: boolean;
  /** Pesan galat pemuatan awal, bila ada. */
  error: string | null;
  setProfile: (p: Profile) => void;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<PassportCtx | null>(null);

export function PassportProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepo(), []);
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profil yang sudah tampil tidak diganti panel galat bila penyegaran
  // di latar (misalnya sesudah bergabung komunitas) gagal sesaat.
  const sudahMuat = useRef(false);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const u = await repo.getSessionUser();
      setUser(u);
      if (!u) {
        // Sesi habis di tengah jalan. proxy.ts menjaga halaman ini untuk
        // tamu; sampai di sini berarti token kedaluwarsa sesudah dimuat.
        location.replace(`/login.html?next=${encodeURIComponent(location.pathname)}`);
        return;
      }
      setProfile(await repo.getMyProfile());
      sudahMuat.current = true;
    } catch (e) {
      const pesan = e instanceof Error ? e.message : 'Gagal memuat Passport.';
      if (sudahMuat.current) toast(`Data belum diperbarui: ${pesan}`, 'error');
      else setError(pesan);
    } finally {
      setLoading(false);
    }
  }, [repo, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const signOut = useCallback(async () => {
    await repo.signOut();
    router.replace('/');
    router.refresh();
  }, [repo, router]);

  const value = useMemo(
    () => ({ repo, user, profile, loading, error, setProfile, reload, signOut }),
    [repo, user, profile, loading, error, reload, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePassport(): PassportCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePassport harus dipakai di dalam <PassportProvider>.');
  return c;
}

/** Profil yang pasti ada. Hanya untuk komponen yang dirender sesudah pemuatan selesai. */
export function useProfile(): Profile {
  const { profile } = usePassport();
  if (!profile) throw new Error('Profil belum dimuat.');
  return profile;
}
