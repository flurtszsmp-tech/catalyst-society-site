import { Icon } from '@/components/ui/Icon';
import { STAGE_RULES } from '@/lib/repo/journey-rules';
import type { Stage } from '@/lib/types';

interface Props {
  stage: Stage;
  /** Ukuran dalam px. Kosongkan bila ukuran diatur CSS. */
  size?: number;
  className?: string;
  /** false bila nama tahap sudah tertulis di sebelahnya. */
  label?: boolean;
}

/**
 * Lencana bergerigi tahap Journey, seperti tanda centang terverifikasi:
 * bidang bergradasi warna tahap dengan ikon tahap di tengahnya. Dipasang di
 * pojok foto profil supaya tahap terbaca tanpa membuka profil.
 */
export function StageSeal({ stage, size, className = '', label = true }: Props) {
  const nama = STAGE_RULES[stage]?.name ?? stage;
  return (
    <span
      className={`stg-seal stg-${stage} ${className}`}
      style={size ? { width: size, height: size } : undefined}
      role={label ? 'img' : undefined}
      aria-label={label ? `Tahap Journey: ${nama}` : undefined}
      aria-hidden={label ? undefined : true}
      title={label ? nama : undefined}
    >
      <Icon name={`j-${stage}`} />
    </span>
  );
}
