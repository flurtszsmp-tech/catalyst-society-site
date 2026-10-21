import type { Metadata } from 'next';
import { SkillsView } from '@/components/passport/profile/SkillsView';
import '@/styles/passport-forms.css';

export const metadata: Metadata = { title: 'Skills & Roles' };

export default function SkillsPage() {
  return (
    <div className="pf">
      <SkillsView />
    </div>
  );
}
