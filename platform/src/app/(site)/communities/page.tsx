import type { Metadata } from 'next';
import { Directory } from '@/components/communities/Directory';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import '@/styles/communities.css';

export const metadata: Metadata = {
  title: 'Community Directory',
  description: 'Komunitas mitra di seluruh ekosistem Catalyst. Pilih kanalnya, lalu gabung langsung lewat pintu resmi mereka.',
  alternates: { canonical: '/communities' },
};

/* Ekspor statis: kanal awal dari ?ch= dibaca di browser oleh Directory. */
export default function CommunitiesPage() {
  return (
    <>
      <SiteNav active="community" />
      <main id="top" className="com-page">
        <section className="band page-top">
          <Directory initialChannel="all" />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
