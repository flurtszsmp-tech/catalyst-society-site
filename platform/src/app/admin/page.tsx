import type { Metadata } from 'next';
import { AdminApp } from '@/components/admin/AdminApp';
import { ToastProvider } from '@/components/ui/Toast';
import '@/styles/ui.css';
import '@/styles/passport.css';
import '@/styles/passport-sections.css';
import '@/styles/admin.css';

export const metadata: Metadata = {
  title: { absolute: 'Admin Catalyst' },
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  // Ekspor statis tidak punya server; akses diperiksa di browser lewat
  // public.is_staff, dan setiap baris data dijaga RLS di database.
  return (
    <div className="pass">
      <ToastProvider>
        <AdminApp />
      </ToastProvider>
    </div>
  );
}
