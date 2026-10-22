'use client';

import Link from 'next/link';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { AvatarCard } from './AvatarCard';
import { CvCard } from './CvCard';
import { publicPath } from './links';
import { ProfileForm } from './ProfileForm';
import { PageHead, WithProfile } from './WithProfile';

export function ProfileView() {
  const { profile } = usePassport();

  return (
    <>
      <PageHead
        title="Profil"
        lead="Foto, identitas, tautan sosial, dan CV yang tampil di Passport Anda."
      >
        {profile && (
          <a className="ui-btn ui-btn-ghost" href={publicPath(profile.slug)}>
            <Icon name="user" />
            Lihat profil publik
          </a>
        )}
      </PageHead>

      <WithProfile>
        {(p) => (
          <>
            {!p.isPublic && (
              <p className="pf-note">
                <Icon name="shield" />
                <span>
                  Profil Anda sedang privat, jadi halaman publik hanya bisa Anda lihat sendiri.{' '}
                  <Link href="/passport/settings">Ubah di Pengaturan</Link>
                </span>
              </p>
            )}
            <AvatarCard profile={p} />
            <ProfileForm profile={p} />
            <CvCard profile={p} />
          </>
        )}
      </WithProfile>
    </>
  );
}
