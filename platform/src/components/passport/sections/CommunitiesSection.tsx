'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { ConfirmDialog, Modal } from '@/components/ui/Dialog';
import { FormError, SubmitButton, TextField } from '@/components/ui/form';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { CHANNELS, COMMUNITIES, visibleCommunities, type ChannelKey, type Community } from '@/lib/data/communities';
import type { Membership } from '@/lib/types';
import { initials } from '@/lib/url';
import { Card, EmptyState, ErrorState, PageHead, SessionGate, Skeleton, errMsg, useFocusAfterRender, useLoad } from './common';

const CHANNEL_LABEL = new Map(CHANNELS.map((c) => [c.key, c.label.id]));

const STATUS: Record<Membership['status'], { label: string; cls: string }> = {
  pending: { label: 'Menunggu verifikasi', cls: 'is-pending' },
  verified: { label: 'Terverifikasi', cls: 'is-approved' },
  rejected: { label: 'Ditolak', cls: 'is-rejected' },
};

/**
 * Logo komunitas berasal dari data tim di repo, berupa path lokal di
 * public/. Hanya path satu garis miring yang diterima; "//host" akan
 * dibaca browser sebagai domain lain.
 */
function localAsset(p: string | null): string | null {
  return p && p.startsWith('/') && !p.startsWith('//') ? p : null;
}

function Logo({ c, name }: { c: Community | null; name: string }) {
  const src = localAsset(c?.logo ?? null);
  if (!src) {
    return (
      <span className="ps2-comm-logo ps2-comm-ini" aria-hidden>
        {initials(name)}
      </span>
    );
  }
  return <Image className="ps2-comm-logo" src={src} alt="" width={40} height={40} />;
}

export function CommunitiesSection() {
  const { repo, user, loading, error, reload } = usePassport();
  const toast = useToast();
  const params = useSearchParams();
  const uid = user?.id ?? null;
  const load = useMemo(() => (uid ? () => repo.listMyMemberships() : null), [repo, uid]);
  const mine = useLoad(load);
  const focusLater = useFocusAfterRender();

  const [channel, setChannel] = useState<ChannelKey | 'all'>('all');
  const [pending, setPending] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<{ slug: string; name: string } | null>(null);
  /** Komunitas yang sedang diajukan atau buktinya sedang diperbarui. */
  const [ajukan, setAjukan] = useState<{ c: Community | null; slug: string; name: string; proof: string; update: boolean } | null>(null);

  const joined = useMemo(() => new Map((mine.data ?? []).map((m) => [m.slug, m])), [mine.data]);
  const verified = (mine.data ?? []).filter((m) => m.status === 'verified').length;
  const menunggu = (mine.data ?? []).filter((m) => m.status === 'pending').length;
  const discover = useMemo(
    () => visibleCommunities().filter((c) => !joined.has(c.slug) && (channel === 'all' || c.channel === channel)),
    [joined, channel],
  );

  // ?gabung=slug dari halaman detail komunitas langsung membuka formulir pengajuan.
  const gabungParam = params.get('gabung');
  useEffect(() => {
    if (!gabungParam || !mine.data || joined.has(gabungParam)) return;
    const c = COMMUNITIES.find((x) => x.slug === gabungParam);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (c) setAjukan({ c, slug: c.slug, name: c.name, proof: '', update: false });
  }, [gabungParam, mine.data, joined]);

  const kirim = async (proof: string) => {
    if (!ajukan) return;
    const { slug, name, update } = ajukan;
    if (update) await repo.updateMembershipProof(slug, proof);
    else await repo.joinCommunity(slug, proof);
    const baru = await repo.listMyMemberships();
    mine.update(() => baru);
    toast(update ? `Bukti untuk ${name} diperbarui.` : `Pengajuan ${name} terkirim. Tim Catalyst akan memeriksanya.`);
    setAjukan(null);
    focusLater('ps2-mine-title');
  };

  const leave = async () => {
    if (!leaving) return;
    const { slug, name } = leaving;
    setPending(slug);
    try {
      await repo.leaveCommunity(slug);
      mine.update((list) => list.filter((m) => m.slug !== slug));
      toast(`Anda keluar dari ${name}.`);
      setLeaving(null);
      focusLater('ps2-mine-title');
      void reload();
    } catch (e) {
      toast(errMsg(e, 'Gagal keluar dari komunitas.'), 'error');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="ps2">
      <PageHead
        title="Komunitas"
        lead="Ajukan komunitas mitra yang benar-benar Anda ikuti. Tim Catalyst memeriksa setiap keanggotaan sebelum tampil di Passport publik Anda."
      />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        <div className="ps2-grid-2">
          <Card
            id="ps2-mine-title"
            title="Komunitas saya"
            aside={mine.data ? <span className="ps2-pill">{verified} terverifikasi</span> : undefined}
          >
            {mine.error ? (
              <ErrorState message={mine.error} onRetry={mine.retry} />
            ) : !mine.data ? (
              <Skeleton rows={3} height={64} label="Memuat komunitas Anda…" />
            ) : mine.data.length === 0 ? (
              <EmptyState icon="users" title="Belum ada komunitas">
                Pilih komunitas di bagian Temukan komunitas, lalu sertakan bukti keanggotaan Anda.
              </EmptyState>
            ) : (
              <ul className="ps2-comms">
                {mine.data.map((m) => {
                  const c = COMMUNITIES.find((x) => x.slug === m.slug) ?? null;
                  const name = c?.name ?? m.slug;
                  const visible = c && c.status !== 'hidden';
                  const st = STATUS[m.status];
                  return (
                    <li key={m.slug} className="ps2-comm cm-item">
                      <Logo c={c} name={name} />
                      <div className="ps2-comm-txt">
                        {visible ? <Link href={`/communities/${encodeURIComponent(m.slug)}`}>{name}</Link> : <b>{name}</b>}
                        <small>
                          <span className={`ps2-pill jr-st ${st.cls}`}>{st.label}</span>
                          {m.proof && <span className="cm-proof">Bukti: {m.proof}</span>}
                        </small>
                        {m.status === 'rejected' && m.reviewNote && <small className="jr-note">Catatan tim: {m.reviewNote}</small>}
                      </div>
                      <div className="cm-act">
                        {m.status !== 'verified' && (
                          <button
                            type="button"
                            className="ui-btn ui-btn-ghost ps2-btn-sm"
                            onClick={() => setAjukan({ c, slug: m.slug, name, proof: m.proof ?? '', update: true })}
                          >
                            {m.status === 'rejected' ? 'Perbaiki bukti' : 'Ubah bukti'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="ui-btn ui-btn-ghost ps2-btn-sm"
                          onClick={() => setLeaving({ slug: m.slug, name })}
                          disabled={pending === m.slug}
                          aria-label={`Keluar dari ${name}`}
                        >
                          Keluar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card id="ps2-rewards-title" title="Cara verifikasi">
            <ol className="ps2-rewards">
              <li className="ps2-reward">
                <span className="ps2-reward-n" aria-hidden>
                  1
                </span>
                <span>
                  Pilih komunitas dan sertakan bukti
                  <small>Username, tautan profil, atau nomor anggota Anda di komunitas itu.</small>
                </span>
              </li>
              <li className="ps2-reward">
                <span className="ps2-reward-n" aria-hidden>
                  2
                </span>
                <span>
                  Tim Catalyst memeriksa
                  <small>Biasanya dalam beberapa hari kerja. Status tampil di daftar Komunitas saya.</small>
                </span>
              </li>
              <li className={`ps2-reward${verified >= 5 ? ' is-done' : ''}`}>
                <span className="ps2-reward-n" aria-hidden>
                  {verified >= 5 ? <Icon name="check" size={14} /> : 3}
                </span>
                <span>
                  Terverifikasi: +5 poin CATA per komunitas
                  <small>Lima komunitas terverifikasi, ditambah lima koneksi, membuka tahap Connector.</small>
                </span>
              </li>
            </ol>
            <p className="ps2-sub" style={{ marginTop: 12 }}>
              {menunggu > 0 ? `${menunggu} pengajuan sedang diperiksa. ` : ''}
              Keluar lalu mengajukan ulang komunitas yang sama tidak memberi poin lagi.
            </p>
          </Card>
        </div>

        <Card id="ps2-discover-title" title="Temukan komunitas">
          <div className="ps2-filters" role="group" aria-label="Saring menurut channel">
            <button type="button" className="ps2-chip" aria-pressed={channel === 'all'} onClick={() => setChannel('all')}>
              Semua
            </button>
            {CHANNELS.map((ch) => (
              <button key={ch.key} type="button" className="ps2-chip" aria-pressed={channel === ch.key} onClick={() => setChannel(ch.key)}>
                {ch.label.id}
              </button>
            ))}
          </div>
          {mine.error ? (
            <p className="ps2-sub">Daftar komunitas tampil setelah komunitas Anda berhasil dimuat.</p>
          ) : !mine.data ? (
            <Skeleton rows={3} height={64} label="Memuat komunitas…" />
          ) : discover.length === 0 ? (
            <EmptyState icon="search" title="Tidak ada komunitas lain">
              {channel === 'all'
                ? 'Anda sudah mengajukan semua komunitas mitra.'
                : `Tidak ada komunitas ${CHANNEL_LABEL.get(channel) ?? ''} yang belum Anda ajukan.`}
            </EmptyState>
          ) : (
            <ul className="ps2-comms">
              {discover.map((c) => (
                <li key={c.slug} className="ps2-comm">
                  <Logo c={c} name={c.name} />
                  <div className="ps2-comm-txt">
                    <Link href={`/communities/${encodeURIComponent(c.slug)}`}>{c.name}</Link>
                    <small>
                      {CHANNEL_LABEL.get(c.channel)} · {c.category}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary ps2-btn-sm"
                    onClick={() => setAjukan({ c, slug: c.slug, name: c.name, proof: '', update: false })}
                    aria-label={`Ajukan ${c.name}`}
                  >
                    Ajukan
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {ajukan && <ProofDialog nama={ajukan.name} awal={ajukan.proof} update={ajukan.update} onClose={() => setAjukan(null)} onSubmit={kirim} />}

        <ConfirmDialog
          open={!!leaving}
          title="Keluar dari komunitas?"
          message={<p>{leaving?.name} akan dihapus dari Passport Anda. Poin yang sudah didapat tetap tersimpan.</p>}
          confirmLabel="Keluar"
          danger
          busy={!!leaving && pending === leaving.slug}
          onConfirm={() => void leave()}
          onCancel={() => setLeaving(null)}
        />
      </SessionGate>
    </div>
  );
}

function ProofDialog({
  nama,
  awal,
  update,
  onClose,
  onSubmit,
}: {
  nama: string;
  awal: string;
  update: boolean;
  onClose: () => void;
  onSubmit: (proof: string) => Promise<void>;
}) {
  const [proof, setProof] = useState(awal);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setGalat(null);
    if (proof.trim().length < 3) return setGalat('Bukti keanggotaan minimal 3 karakter.');
    setSibuk(true);
    try {
      await onSubmit(proof);
    } catch (err) {
      setGalat(errMsg(err, 'Gagal mengirim pengajuan.'));
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={update ? `Bukti keanggotaan ${nama}` : `Ajukan ${nama}`} width={480} dismissible={!sibuk}>
      <form className="ui-form" onSubmit={(e) => void kirim(e)}>
        <p className="ps2-sub">
          Tim Catalyst mencocokkan bukti ini dengan data {nama}. Keanggotaan baru tampil di Passport publik dan dihitung untuk Journey
          setelah diterima.
        </p>
        <TextField
          label="Bukti keanggotaan"
          hint="Contoh: username Discord/Telegram, tautan profil di komunitas, atau nomor anggota."
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          maxLength={300}
          counter
          data-autofocus
          required
        />
        <FormError message={galat} />
        <div className="ui-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose} disabled={sibuk}>
            Batal
          </button>
          <SubmitButton busy={sibuk}>{update ? 'Simpan bukti' : 'Kirim pengajuan'}</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
