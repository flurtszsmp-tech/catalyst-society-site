'use client';

import { SkillsForm } from './SkillsForm';
import { PageHead, WithProfile } from './WithProfile';

export function SkillsView() {
  return (
    <>
      <PageHead
        title="Skills & Roles"
        lead="Keahlian dan peran membantu anggota lain dan mitra komunitas menemukan Anda."
      />
      <WithProfile>{(p) => <SkillsForm profile={p} />}</WithProfile>
    </>
  );
}
