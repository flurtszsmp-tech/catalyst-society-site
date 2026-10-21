import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { LanguageProvider } from '@/lib/i18n/provider';
import { SITE_URL } from '@/lib/env';
import '@/styles/tokens.css';
import './globals.css';

// Di-host sendiri oleh Next.js saat build; browser tidak meminta apa pun ke Google.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: {
    default: 'Catalyst Society. Accelerating Future Builders.',
    template: '%s — Catalyst Society',
  },
  description:
    'Catalyst Society adalah ekosistem generasi muda yang menghubungkan builders, innovators, investors, dan changemakers menjadi dampak nyata.',
  other: { google: 'notranslate' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

/*
 * Dipasang sebelum cat pertama, sama seperti situs lama, supaya tema
 * gelap tidak berkedip putih. Karena kelas <html> berbeda antara server
 * dan browser, <html> diberi suppressHydrationWarning. Peringatan itu
 * hanya ditekan untuk atribut <html> sendiri, bukan untuk anak anaknya.
 */
const temaAwal = `try{if(localStorage.getItem('catalyst-theme')==='dark')document.documentElement.classList.add('dark-theme')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" translate="no" className={`notranslate ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaAwal }} />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
