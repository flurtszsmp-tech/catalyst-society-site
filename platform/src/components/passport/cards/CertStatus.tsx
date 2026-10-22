import { Icon } from '@/components/ui/Icon';

/**
 * Penanda status di pojok kiri bawah gambar sertifikat. Biru dengan centang bila
 * ada ID kredensial atau tautan bukti, kuning bila belum. Induknya wajib
 * `position: relative`.
 */
export function CertStatus({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="cert-chip ok">
      <Icon name="verified" />
      Terverifikasi
    </span>
  ) : (
    <span className="cert-chip wait">Belum terverifikasi</span>
  );
}
