'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { ConfirmDialog, Modal } from '@/components/ui/Dialog';
import { FileButton, FormError, SubmitButton, TextField } from '@/components/ui/form';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { LIMITS, assertFile } from '@/lib/repo/types';
import type { Certificate, CertificateInput } from '@/lib/types';
import { CertStatus } from '@/components/passport/cards/CertStatus';
import { certificateImageSrc, safeHref } from '@/lib/url';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHead,
  SessionGate,
  Skeleton,
  errMsg,
  fmtDate,
  useFocusAfterRender,
  useLoad,
} from './common';
import { dayError, hasErrors, lengthError, orNull, urlError, urlOrNull, type Errors } from './validate';

/** Sama dengan trigger batas sertifikat di database. */
const MAX_CERTS = 100;

type Editing = { mode: 'new' } | { mode: 'edit'; cert: Certificate };

/**
 * Hanya sertifikat buatan sendiri yang belum diverifikasi yang boleh
 * diubah; RLS menolak pembaruan lain, jadi tombolnya tidak ditampilkan.
 */
function isEditable(c: Certificate): boolean {
  return c.source === 'self' && !c.isVerified;
}

function isVerifiedCert(c: Certificate): boolean {
  return c.source === 'catalyst' || c.isVerified;
}

/** Gambar pengganti bila sertifikat tidak punya foto. Digambar, bukan berkas. */
function CertPlaceholder() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" preserveAspectRatio="xMidYMid meet">
      <rect x="22" y="18" width="116" height="84" rx="4" strokeOpacity=".55" />
      <rect x="28" y="24" width="104" height="72" rx="2" strokeOpacity=".3" strokeDasharray="3 3" />
      <path d="M50 42h60M58 52h44" strokeOpacity=".6" strokeLinecap="round" />
      <path d="M50 64h36M50 72h28" strokeOpacity=".35" strokeLinecap="round" />
      <circle cx="108" cy="74" r="9" strokeOpacity=".6" />
      <path d="M103 82l-3 10 8-4 8 4-3-10" strokeOpacity=".6" strokeLinejoin="round" />
    </svg>
  );
}

export function CertificatesSection() {
  const { repo, user, loading, error, reload } = usePassport();
  const toast = useToast();
  const uid = user?.id ?? null;
  const load = useMemo(() => (uid ? () => repo.listCertificates(uid) : null), [repo, uid]);
  const list = useLoad(load);
  const focusLater = useFocusAfterRender();

  const [editing, setEditing] = useState<Editing | null>(null);
  const [removing, setRemoving] = useState<Certificate | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [formBusy, setFormBusy] = useState(false);

  const full = (list.data?.length ?? 0) >= MAX_CERTS;

  const saved = (c: Certificate, created: boolean) => {
    list.update((l) => (created ? [c, ...l] : l.map((x) => (x.id === c.id ? c : x))));
    setEditing(null);
    toast(created ? 'Sertifikat ditambahkan.' : 'Sertifikat diperbarui.');
    focusLater(`ps2-cert-${c.id}`);
  };

  const remove = async () => {
    if (!removing) return;
    setBusyDelete(true);
    try {
      await repo.deleteCertificate(removing.id);
      list.update((l) => l.filter((x) => x.id !== removing.id));
      toast('Sertifikat dihapus.');
      setRemoving(null);
      focusLater('ps2-certs-title');
    } catch (e) {
      toast(errMsg(e, 'Gagal menghapus sertifikat.'), 'error');
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <div className="ps2">
      <PageHead
        title="Sertifikat"
        lead="Sertifikat dengan ID kredensial atau tautan bukti langsung bertanda terverifikasi. Sertifikat tanpa bukti tetap tampil, dengan keterangan belum terverifikasi."
      >
        {!loading && !error && (
          <button
            type="button"
            className="ui-btn ui-btn-primary"
            onClick={() => setEditing({ mode: 'new' })}
            disabled={!list.data || full}
          >
            <Icon name="plus" />
            Tambah sertifikat
          </button>
        )}
      </PageHead>
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        <Card
          id="ps2-certs-title"
          title="Sertifikat saya"
          aside={list.data ? <span className="ps2-pill">{list.data.length} sertifikat</span> : undefined}
        >
          {list.error ? (
            <ErrorState message={list.error} onRetry={list.retry} />
          ) : !list.data ? (
            <Skeleton rows={2} height={180} label="Memuat sertifikat…" />
          ) : list.data.length === 0 ? (
            <EmptyState
              icon="award"
              title="Belum ada sertifikat"
              action={
                <button type="button" className="ui-btn ui-btn-primary" onClick={() => setEditing({ mode: 'new' })}>
                  <Icon name="plus" />
                  Tambah sertifikat
                </button>
              }
            >
              Tambahkan sertifikat kursus, pelatihan, atau kompetisi. Sertifikat dari program Catalyst akan muncul di sini
              dengan tanda Terverifikasi.
            </EmptyState>
          ) : (
            <>
              {full && (
                <p className="ps2-note" style={{ marginBottom: 12 }}>
                  Batas {MAX_CERTS} sertifikat tercapai. Hapus sertifikat lama untuk menambah yang baru.
                </p>
              )}
              <ul className="ps2-certs">
                {list.data.map((c) => (
                  <CertItem
                    key={c.id}
                    c={c}
                    onEdit={() => setEditing({ mode: 'edit', cert: c })}
                    onDelete={() => setRemoving(c)}
                  />
                ))}
              </ul>
            </>
          )}
        </Card>

        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={editing?.mode === 'edit' ? 'Ubah sertifikat' : 'Tambah sertifikat'}
          width={600}
          dismissible={!formBusy}
        >
          {editing && (
            <CertForm
              key={editing.mode === 'edit' ? editing.cert.id : 'new'}
              initial={editing.mode === 'edit' ? editing.cert : null}
              onCancel={() => setEditing(null)}
              onSaved={saved}
              onBusy={setFormBusy}
            />
          )}
        </Modal>

        <ConfirmDialog
          open={!!removing}
          title="Hapus sertifikat?"
          message={<p>“{removing?.title}” beserta gambarnya akan dihapus dan tidak bisa dikembalikan.</p>}
          confirmLabel="Hapus"
          danger
          busy={busyDelete}
          onConfirm={() => void remove()}
          onCancel={() => setRemoving(null)}
        />
      </SessionGate>
    </div>
  );
}

function CertItem({ c, onEdit, onDelete }: { c: Certificate; onEdit: () => void; onDelete: () => void }) {
  const img = certificateImageSrc(c.imagePath);
  const href = safeHref(c.credentialUrl);
  const verified = isVerifiedCert(c);
  return (
    <li className="ps2-cert">
      <div className="ps2-cert-img">
        {img ? (
          // unoptimized: gambar bisa berupa data URL mode demo.
          <Image src={img} alt={`Gambar sertifikat ${c.title}`} fill sizes="(max-width: 640px) 100vw, 320px" unoptimized />
        ) : (
          <CertPlaceholder />
        )}
        <CertStatus verified={verified} />
      </div>
      <div className="ps2-cert-body">
        <h3 id={`ps2-cert-${c.id}`} tabIndex={-1}>
          {c.title}
        </h3>
        <p>
          {c.issuer}
          {c.issuedOn && (
            <>
              {' · '}
              <time dateTime={c.issuedOn}>{fmtDate(c.issuedOn)}</time>
            </>
          )}
        </p>
        {c.credentialId && <p>ID kredensial: {c.credentialId}</p>}
        {!verified && <p className="cert-wait">Tambahkan ID kredensial atau tautan bukti agar terverifikasi.</p>}
        <div className="ps2-cert-foot">
          {href ? (
            <a className="ps2-link" href={href} target="_blank" rel="noopener noreferrer nofollow">
              Lihat kredensial
              <span className="sr-only"> {c.title} (membuka tab baru)</span>
            </a>
          ) : (
            <span />
          )}
          {isEditable(c) && (
            <div className="ps2-acts">
              <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" onClick={onEdit} aria-label={`Ubah ${c.title}`}>
                Ubah
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-ghost ps2-btn-sm"
                onClick={onDelete}
                aria-label={`Hapus ${c.title}`}
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

type Field = 'title' | 'issuer' | 'issuedOn' | 'credentialId' | 'credentialUrl' | 'image';

/** undefined: biarkan gambar lama, null: hapus, objek: ganti dengan berkas baru. */
type ImagePick = { file: File; url: string } | null | undefined;

function CertForm({
  initial,
  onCancel,
  onSaved,
  onBusy,
}: {
  initial: Certificate | null;
  onCancel: () => void;
  onSaved: (c: Certificate, created: boolean) => void;
  /** Memberi tahu Modal agar tidak bisa ditutup selama penyimpanan. */
  onBusy: (busy: boolean) => void;
}) {
  const { repo } = usePassport();
  const [v, setV] = useState({
    title: initial?.title ?? '',
    issuer: initial?.issuer ?? '',
    issuedOn: initial?.issuedOn ?? '',
    credentialId: initial?.credentialId ?? '',
    credentialUrl: initial?.credentialUrl ?? '',
  });
  const [pick, setPick] = useState<ImagePick>(undefined);
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    onBusy(busy);
    return () => onBusy(false);
  }, [busy, onBusy]);

  // URL objek pratinjau dilepas saat diganti atau saat formulir ditutup, supaya memori berkas tidak tertahan.
  const lastUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    },
    [],
  );
  const choose = (next: ImagePick) => {
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    lastUrl.current = next ? next.url : null;
    setPick(next);
    setErrors((s) => (s.image ? { ...s, image: undefined } : s));
  };

  const onFile = (f: File) => {
    try {
      assertFile(f, LIMITS.certTypes, LIMITS.certBytes, 'Gambar sertifikat');
    } catch (e) {
      setErrors((s) => ({ ...s, image: errMsg(e) }));
      return;
    }
    setErrors((s) => ({ ...s, image: undefined }));
    choose({ file: f, url: URL.createObjectURL(f) });
  };

  const preview = pick ? pick.url : pick === null ? null : certificateImageSrc(initial?.imagePath ?? null);
  const hasImage = !!preview;

  const set = (k: Exclude<Field, 'image'>) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setV((s) => ({ ...s, [k]: value }));
    if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined }));
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Errors<Field> = {
      title: lengthError(v.title, 160, 'Judul', true) ?? undefined,
      issuer: lengthError(v.issuer, 120, 'Penerbit', true) ?? undefined,
      issuedOn: dayError(v.issuedOn, 'Tanggal terbit') ?? undefined,
      credentialId: lengthError(v.credentialId, 80, 'ID kredensial') ?? undefined,
      credentialUrl: urlError(v.credentialUrl) ?? undefined,
      // Berkas yang ditolak tidak pernah disimpan di pick, jadi galat
      // gambar lama tidak boleh menahan penyimpanan tanpa gambar.
    };
    setErrors(e);
    if (hasErrors(e)) return;
    const input: CertificateInput = {
      title: v.title.trim(),
      issuer: v.issuer.trim(),
      issuedOn: v.issuedOn || null,
      credentialId: orNull(v.credentialId),
      credentialUrl: urlOrNull(v.credentialUrl),
    };
    const image = pick === undefined ? undefined : pick ? pick.file : null;
    setBusy(true);
    setFormError(null);
    try {
      const c = initial
        ? await repo.updateCertificate(initial.id, input, image)
        : await repo.createCertificate(input, image ?? null);
      onSaved(c, !initial);
    } catch (err) {
      setFormError(errMsg(err, 'Gagal menyimpan sertifikat.'));
      setBusy(false);
    }
  };

  return (
    <form className="ps2-form" onSubmit={submit} noValidate>
      <FormError message={formError} />
      <TextField
        label="Judul sertifikat"
        value={v.title}
        onChange={set('title')}
        maxLength={160}
        counter
        required
        error={errors.title}
        data-autofocus
      />
      <TextField
        label="Penerbit"
        hint="Lembaga atau penyelenggara yang menerbitkan."
        value={v.issuer}
        onChange={set('issuer')}
        maxLength={120}
        counter
        required
        error={errors.issuer}
      />
      <div className="ps2-row-2">
        <TextField label="Tanggal terbit" type="date" value={v.issuedOn} onChange={set('issuedOn')} error={errors.issuedOn} />
        <TextField
          label="ID kredensial"
          hint="Nomor sertifikat dari penerbit."
          value={v.credentialId}
          onChange={set('credentialId')}
          maxLength={80}
          error={errors.credentialId}
        />
      </div>
      <p className="cert-rule">
        <Icon name="verified" />
        <span>
          Isi <b>ID kredensial</b> atau <b>tautan bukti</b> supaya sertifikat langsung bertanda terverifikasi. Tanpa keduanya, sertifikat
          tetap tampil di profil publik dengan keterangan kecil &ldquo;belum terverifikasi&rdquo;.
        </span>
      </p>
      <TextField
        label="Tautan kredensial / bukti"
        hint="Halaman verifikasi penerbit, unggahan LinkedIn, atau tautan Google Drive."
        type="url"
        inputMode="url"
        placeholder="https://"
        value={v.credentialUrl}
        onChange={set('credentialUrl')}
        maxLength={500}
        error={errors.credentialUrl}
      />

      <fieldset className="ui-field" aria-describedby="ps2-cert-img-hint">
        <legend className="ui-label">Gambar sertifikat (opsional)</legend>
        <div className="ps2-img-pick" style={{ marginTop: 6 }}>
          <div className="ps2-img-prev">
            {preview ? (
              <Image src={preview} alt="Pratinjau gambar sertifikat" fill sizes="120px" unoptimized />
            ) : (
              <CertPlaceholder />
            )}
          </div>
          <div className="ps2-acts">
            <FileButton accept={LIMITS.certTypes.join(',')} onFile={onFile} disabled={busy}>
              {hasImage ? 'Ganti gambar' : 'Pilih gambar'}
            </FileButton>
            {hasImage && (
              <button type="button" className="ui-btn ui-btn-ghost" onClick={() => choose(null)} disabled={busy}>
                Hapus gambar
              </button>
            )}
          </div>
        </div>
        {errors.image ? (
          <p id="ps2-cert-img-hint" className="ui-error" role="alert">
            {errors.image}
          </p>
        ) : (
          <p id="ps2-cert-img-hint" className="ui-hint">
            JPG, PNG, atau WebP, maksimal 5 MB.
          </p>
        )}
      </fieldset>

      <div className="ui-actions">
        <button type="button" className="ui-btn ui-btn-ghost" onClick={onCancel} disabled={busy}>
          Batal
        </button>
        <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Tambah sertifikat'}</SubmitButton>
      </div>
    </form>
  );
}
