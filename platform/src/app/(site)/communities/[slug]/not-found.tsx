'use client';

import Link from 'next/link';
import { useCommunityCopy } from '@/components/communities/copy';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import '@/styles/communities.css';

export default function CommunityNotFound() {
  const k = useCommunityCopy();
  return (
    <>
      <SiteNav active="community" />
      <main id="top" className="com-page">
        <section className="band page-top">
          <div className="wrap com-404">
            <h1 className="h-lg">{k.takAda}</h1>
            <p className="lead">{k.takAdaSub}</p>
            <Link className="btn" href="/communities">
              {k.kembali}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
