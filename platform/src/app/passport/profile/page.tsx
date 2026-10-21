import type { Metadata } from 'next';
import { ProfileView } from '@/components/passport/profile/ProfileView';
import '@/styles/passport-forms.css';

export const metadata: Metadata = { title: 'Profil' };

export default function ProfilePage() {
  return (
    <div className="pf">
      <ProfileView />
    </div>
  );
}
