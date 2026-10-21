'use client';

import { PageHead, WithProfile } from '@/components/passport/profile/WithProfile';
import { AccountCard } from './AccountCard';
import { AppearanceCard } from './AppearanceCard';
import { DangerCard } from './DangerCard';
import { PrivacyCard } from './PrivacyCard';

export function SettingsView() {
  return (
    <>
      <PageHead title="Pengaturan" lead="Akun, tampilan, privasi, dan penghapusan akun." />
      <WithProfile>
        {(p) => (
          <>
            <AccountCard profile={p} />
            <AppearanceCard />
            <PrivacyCard profile={p} />
            <DangerCard profile={p} />
          </>
        )}
      </WithProfile>
    </>
  );
}
