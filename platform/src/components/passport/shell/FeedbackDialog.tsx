'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Modal } from '@/components/ui/Dialog';
import { FormError, SubmitButton, TextArea } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import type { FeedbackKind } from '@/lib/types';

const JENIS: { key: FeedbackKind; label: string; hint: string }[] = [
  { key: 'saran', label: 'Saran', hint: 'Ide fitur atau perbaikan tampilan.' },
  { key: 'masalah', label: 'Masalah', hint: 'Sesuatu tidak berjalan semestinya.' },
  { key: 'pertanyaan', label: 'Pertanyaan', hint: 'Hal yang ingin Anda tanyakan ke tim.' },
  { key: 'lainnya', label: 'Lainnya', hint: 'Apa pun yang ingin Anda sampaikan.' },
];

/** Masukan dikirim ke tabel feedback dan hanya terbaca admin Catalyst. */
export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const { repo } = usePassport();
  const toast = useToast();
  const path = usePathname() ?? '/passport';
  const [kind, setKind] = useState<FeedbackKind>('saran');
  const [pesan, setPesan] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setGalat(null);
    if (pesan.trim().length < 5) return setGalat('Tulis masukan minimal 5 karakter.');
    setSibuk(true);
    try {
      await repo.sendFeedback(kind, pesan, path);
      toast('Terima kasih. Masukan Anda sudah diterima tim Catalyst.');
      onClose();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal mengirim masukan.');
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Kirim masukan" width={500} dismissible={!sibuk}>
      <form className="ui-form" onSubmit={(e) => void kirim(e)}>
        <div className="fb-kinds" role="radiogroup" aria-label="Jenis masukan">
          {JENIS.map((j) => (
            <button
              key={j.key}
              type="button"
              role="radio"
              aria-checked={kind === j.key}
              className={`fb-kind${kind === j.key ? ' on' : ''}`}
              onClick={() => setKind(j.key)}
            >
              <b>{j.label}</b>
              <small>{j.hint}</small>
            </button>
          ))}
        </div>
        <TextArea
          label="Pesan"
          hint="Semakin spesifik, semakin cepat tim bisa menindaklanjuti."
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          maxLength={2000}
          counter
          rows={5}
          data-autofocus
          required
        />
        <FormError message={galat} />
        <div className="ui-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose} disabled={sibuk}>
            Batal
          </button>
          <SubmitButton busy={sibuk}>Kirim masukan</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
