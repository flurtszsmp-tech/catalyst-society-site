import Image from 'next/image';
import type { Community } from '@/lib/data/communities';
import { initials } from '@/lib/url';
import { logoSrc } from './shared';

/**
 * Ubin logo mitra. Aturan 2 situs lama memakai logo bawaan bila berkas
 * logo kosong, tetapi berkas bawaan itu tidak pernah ada; inisial nama
 * dipakai sebagai gantinya supaya ubin tidak tampil sebagai gambar rusak.
 */
export function CommunityLogo({ community, size = 52 }: { community: Pick<Community, 'logo' | 'name'>; size?: number }) {
  const src = logoSrc(community);
  return (
    <span className="com-logo" aria-hidden>
      {src ? (
        <Image src={src} alt="" width={size} height={size} />
      ) : (
        <span className="com-logo-fallback">{initials(community.name)}</span>
      )}
    </span>
  );
}
