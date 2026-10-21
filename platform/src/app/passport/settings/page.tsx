import type { Metadata } from 'next';
import { SettingsView } from '@/components/passport/settings/SettingsView';
import '@/styles/passport-forms.css';

export const metadata: Metadata = { title: 'Pengaturan' };

export default function SettingsPage() {
  return (
    <div className="pf">
      <SettingsView />
    </div>
  );
}
