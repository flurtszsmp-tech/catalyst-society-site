'use client';

import { useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { CvVisibilityToggle } from '@/components/passport/profile/CvCard';
import { errorText } from '@/components/passport/profile/hooks';
import { Toggle } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import type { Profile } from '@/lib/types';
import { SlugField } from './SlugField';

export function PrivacyCard({ profile }: { profile: Profile }) {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function ubah(v: boolean) {
    setBusy(true);
    try {
      setProfile(await repo.updateMyProfile({ isPublic: v }));
      toast(v ? 'Profil kini publik.' : 'Profil kini privat.', 'ok');
    } catch (e) {
      toast(errorText(e, 'Gagal mengubah privasi profil.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="pf-card" aria-labelledby="pf-privasi-h">
      <div className="pf-card-head">
        <div>
          <h2 id="pf-privasi-h">Privasi</h2>
          <p>Atur siapa yang bisa melihat Passport Anda.</p>
        </div>
      </div>

      <Toggle
        label="Profil publik"
        checked={profile.isPublic}
        disabled={busy}
        onChange={(v) => void ubah(v)}
        hint={
          profile.isPublic
            ? 'Aktif: siapa pun yang punya tautan bisa membuka profil Anda, dan Anda muncul di pencarian orang serta daftar koneksi anggota lain.'
            : 'Nonaktif: halaman profil publik, pencarian orang, dan daftar koneksi anggota lain tidak menampilkan Anda, termasuk CV. Anda tetap bisa memakai Passport seperti biasa.'
        }
      />

      <div className="pf-sep">
        <CvVisibilityToggle profile={profile} />
      </div>

      <div className="pf-sep">
        <SlugField profile={profile} />
      </div>
    </section>
  );
}
