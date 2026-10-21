import Image from 'next/image';
import type { Profile } from '@/lib/types';
import { avatarSrc, initials } from '@/lib/url';
import { canOptimize } from './format';

interface Props {
  person: Pick<Profile, 'fullName' | 'avatarPath' | 'avatarUrl'>;
  /** Ukuran intrinsik dalam px; ukuran tampil diatur CSS kelasnya. */
  size: number;
  className?: string;
  alt?: string;
}

/**
 * Foto profil, atau inisial bila belum ada foto. Tidak pernah merender
 * <img> dengan src kosong: itu tampil sebagai gambar rusak, bukan
 * sebagai "belum ada foto".
 */
export function Avatar({ person, size, className = '', alt = '' }: Props) {
  const src = avatarSrc(person);
  if (!src) {
    return (
      <span className={`${className} pass-ini`} aria-hidden={alt ? undefined : true} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        {initials(person.fullName)}
      </span>
    );
  }
  return <Image className={className} src={src} alt={alt} width={size} height={size} unoptimized={!canOptimize(src)} />;
}
