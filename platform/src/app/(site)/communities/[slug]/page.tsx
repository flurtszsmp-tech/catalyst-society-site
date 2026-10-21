import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CommunityDetail } from '@/components/communities/CommunityDetail';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { findCommunity, visibleCommunities } from '@/lib/data/communities';
import '@/styles/communities.css';

type Props = { params: Promise<{ slug: string }> };

/* Direktori ditulis di kode, jadi semua halaman detail dibangun saat build. */
export function generateStaticParams() {
  return visibleCommunities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = findCommunity(slug);
  if (!c) return { title: 'Komunitas tidak ditemukan', robots: { index: false } };
  return {
    title: c.name,
    description: c.short.id || c.short.en || c.name,
    alternates: { canonical: `/communities/${c.slug}` },
    openGraph: { title: `${c.name} — Catalyst Society`, description: c.short.id || c.name },
  };
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const c = findCommunity(slug);
  if (!c) notFound();

  return (
    <>
      <SiteNav active="community" />
      <main id="top" className="com-page">
        <section className="band page-top">
          <CommunityDetail community={c} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
