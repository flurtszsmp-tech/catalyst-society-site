'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Modal } from '@/components/ui/Dialog';
import { FormError, TextArea } from '@/components/ui/form';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { findCommunity } from '@/lib/data/communities';
import { CLAIM_INFO, STAGE_RULES } from '@/lib/repo/journey-rules';
import type { ProfileSummary, ReviewQueue } from '@/lib/types';
import { certificateImageSrc, safeHref } from '@/lib/url';
import { Card, EmptyState, ErrorState, PageHead, PersonAvatar, SessionGate, Skeleton, errMsg, fmtDate, useLoad } from './common';

type Tugas =
  | { jenis: 'komunitas'; userId: string; slug: string; judul: string }
  | { jenis: 'sertifikat'; id: string; judul: string }
  | { jenis: 'klaim'; id: string; judul: string };

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

/**
 * Antrean pemeriksaan untuk tim Catalyst. Halaman ini hanya tampilan:
 * fungsi staff_review_* di database memeriksa sendiri apakah pemanggilnya
 * anggota tim, jadi membuka alamat ini tanpa hak tidak memberi apa pun.
 */
export function ReviewSection() {
  const { repo, user, loading, error, reload } = usePassport();
  const toast = useToast();
  const [staff, setStaff] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    let hidup = true;
    repo.isStaff().then((v) => hidup && setStaff(v), () => hidup && setStaff(false));
    return () => {
      hidup = false;
    };
  }, [repo, user]);

  const load = useMemo(() => (staff ? () => repo.getReviewQueue() : null), [repo, staff]);
  const q = useLoad(load);
  const [tolak, setTolak] = useState<Tugas | null>(null);
  const [sibuk, setSibuk] = useState<string | null>(null);

  async function putuskan(t: Tugas, setuju: boolean, catatan?: string) {
    const kunci = t.jenis === 'komunitas' ? `${t.userId}:${t.slug}` : t.id;
    setSibuk(kunci);
    try {
      if (t.jenis === 'komunitas') await repo.reviewMembership(t.userId, t.slug, setuju, catatan);
      else if (t.jenis === 'sertifikat') await repo.reviewCertificate(t.id, setuju, catatan);
      else await repo.reviewClaim(t.id, setuju, catatan);
      toast(`${t.judul}: ${setuju ? 'diterima' : 'ditolak'}.`);
      q.update((d: ReviewQueue) => ({
        memberships: d.memberships.filter((m) => !(t.jenis === 'komunitas' && m.person.id === t.userId && m.membership.slug === t.slug)),
        certificates: d.certificates.filter((c) => !(t.jenis === 'sertifikat' && c.certificate.id === t.id)),
        claims: d.claims.filter((c) => !(t.jenis === 'klaim' && c.claim.id === t.id)),
      }));
      setTolak(null);
      // Pemeriksa bisa saja memeriksa dirinya sendiri; profil ikut disegarkan.
      void reload();
    } catch (e) {
      toast(errMsg(e, 'Gagal menyimpan pemeriksaan.'), 'error');
    } finally {
      setSibuk(null);
    }
  }

  const tombol = (t: Tugas) => {
    const kunci = t.jenis === 'komunitas' ? `${t.userId}:${t.slug}` : t.id;
    return (
      <div className="rv-act">
        <button type="button" className="ui-btn ui-btn-primary ps2-btn-sm" disabled={sibuk !== null} onClick={() => void putuskan(t, true)}>
          <Icon name="check" />
          {sibuk === kunci ? 'Menyimpan…' : 'Terima'}
        </button>
        <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" disabled={sibuk !== null} onClick={() => setTolak(t)}>
          Tolak
        </button>
      </div>
    );
  };

  const orang = (p: ProfileSummary) => (
    <Link className="rv-who" href={`/p/?u=${p.slug}`}>
      <PersonAvatar person={p} size={32} />
      <span>
        <b>{p.fullName}</b>
        <small>{STAGE_RULES[p.journeyStage]?.name}</small>
      </span>
    </Link>
  );

  const d = q.data;
  const jumlah = d ? d.memberships.length + d.certificates.length + d.claims.length : 0;

  return (
    <div className="ps2">
      <PageHead
        title="Verifikasi"
        lead="Antrean pemeriksaan tim Catalyst: keanggotaan komunitas, sertifikat, dan pengajuan tahap Journey."
      />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        {staff === null ? (
          <Skeleton rows={3} height={72} label="Memeriksa hak akses…" />
        ) : !staff ? (
          <EmptyState icon="lock" title="Khusus tim Catalyst">
            Halaman ini hanya untuk anggota tim pemeriksa.
          </EmptyState>
        ) : q.error ? (
          <ErrorState message={q.error} onRetry={q.retry} />
        ) : !d ? (
          <Skeleton rows={4} height={72} label="Memuat antrean…" />
        ) : jumlah === 0 ? (
          <EmptyState icon="check" title="Antrean kosong">
            Tidak ada yang menunggu pemeriksaan. Pengajuan baru muncul di sini.
          </EmptyState>
        ) : (
          <>
            <Card id="rv-claims" title={`Pengajuan tahap (${d.claims.length})`}>
              {d.claims.length === 0 ? (
                <p className="ps2-sub">Tidak ada pengajuan tahap.</p>
              ) : (
                <ul className="ps2-list rv-list">
                  {d.claims.map(({ person, claim: c }) => {
                    const href = safeHref(c.url);
                    return (
                      <li key={c.id}>
                        {orang(person)}
                        <div className="rv-body">
                          <b>
                            {CLAIM_INFO[c.kind].title} <span className="ps2-pill">{STAGE_RULES[CLAIM_INFO[c.kind].stage].name}</span>
                          </b>
                          <p>{c.detail}</p>
                          {c.valuation ? <small>Valuasi: {rp(c.valuation)}</small> : null}
                          {href && (
                            <a className="ps2-link" href={href} target="_blank" rel="noopener noreferrer nofollow">
                              Buka bukti <Icon name="external" />
                            </a>
                          )}
                          <small>Diajukan {fmtDate(c.createdAt)}</small>
                        </div>
                        {tombol({ jenis: 'klaim', id: c.id, judul: `${CLAIM_INFO[c.kind].title} ${person.fullName}` })}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card id="rv-coms" title={`Keanggotaan komunitas (${d.memberships.length})`}>
              {d.memberships.length === 0 ? (
                <p className="ps2-sub">Tidak ada keanggotaan yang menunggu.</p>
              ) : (
                <ul className="ps2-list rv-list">
                  {d.memberships.map(({ person, membership: m }) => {
                    const nama = findCommunity(m.slug)?.name ?? m.slug;
                    return (
                      <li key={`${person.id}:${m.slug}`}>
                        {orang(person)}
                        <div className="rv-body">
                          <b>{nama}</b>
                          <p>Bukti: {m.proof || <em>tidak diisi</em>}</p>
                          <small>Diajukan {fmtDate(m.joinedAt)}</small>
                        </div>
                        {tombol({ jenis: 'komunitas', userId: person.id, slug: m.slug, judul: `${nama} ${person.fullName}` })}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card id="rv-certs" title={`Sertifikat (${d.certificates.length})`}>
              {d.certificates.length === 0 ? (
                <p className="ps2-sub">Tidak ada sertifikat yang menunggu.</p>
              ) : (
                <ul className="ps2-list rv-list">
                  {d.certificates.map(({ person, certificate: c }) => {
                    const img = certificateImageSrc(c.imagePath);
                    const href = safeHref(c.credentialUrl);
                    return (
                      <li key={c.id}>
                        {orang(person)}
                        <div className="rv-body">
                          <b>{c.title}</b>
                          <p>
                            {c.issuer}
                            {c.issuedOn ? ` · ${fmtDate(c.issuedOn)}` : ''}
                            {c.credentialId ? ` · ID ${c.credentialId}` : ''}
                          </p>
                          <span className="rv-links">
                            {img && (
                              <a className="ps2-link" href={img} target="_blank" rel="noopener noreferrer">
                                Lihat gambar <Icon name="external" />
                              </a>
                            )}
                            {href && (
                              <a className="ps2-link" href={href} target="_blank" rel="noopener noreferrer nofollow">
                                Cek kredensial <Icon name="external" />
                              </a>
                            )}
                          </span>
                        </div>
                        {tombol({ jenis: 'sertifikat', id: c.id, judul: `${c.title} ${person.fullName}` })}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </>
        )}

        {tolak && (
          <RejectDialog
            judul={tolak.judul}
            busy={sibuk !== null}
            onClose={() => setTolak(null)}
            onConfirm={(catatan) => void putuskan(tolak, false, catatan)}
          />
        )}
      </SessionGate>
    </div>
  );
}

function RejectDialog({ judul, busy, onClose, onConfirm }: { judul: string; busy: boolean; onClose: () => void; onConfirm: (c: string) => void }) {
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  return (
    <Modal open onClose={onClose} title={`Tolak: ${judul}`} width={480} dismissible={!busy}>
      <form
        className="ui-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (catatan.trim().length < 5) return setGalat('Tulis alasan singkat supaya pengguna tahu apa yang perlu diperbaiki.');
          onConfirm(catatan.trim());
        }}
      >
        <TextArea
          label="Alasan penolakan"
          hint="Tampil di Passport pengguna. Contoh: username tidak ditemukan di daftar anggota."
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          maxLength={300}
          counter
          rows={3}
          data-autofocus
        />
        <FormError message={galat} />
        <div className="ui-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="submit" className="ui-btn ui-btn-danger" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Tolak'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
