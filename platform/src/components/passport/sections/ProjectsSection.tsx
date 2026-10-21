'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { ConfirmDialog, Modal } from '@/components/ui/Dialog';
import { FormError, SubmitButton, TextArea, TextField } from '@/components/ui/form';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import type { Project, ProjectInput } from '@/lib/types';
import { safeHref } from '@/lib/url';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHead,
  SessionGate,
  Skeleton,
  errMsg,
  fmtNumber,
  fmtRange,
  useFocusAfterRender,
  useLoad,
} from './common';
import { dayError, hasErrors, lengthError, orNull, urlError, urlOrNull, type Errors } from './validate';

/** Sama dengan trigger batas projek di database. */
const MAX_PROJECTS = 50;

type Editing = { mode: 'new' } | { mode: 'edit'; project: Project };

export function ProjectsSection() {
  const { repo, user, loading, error, reload } = usePassport();
  const toast = useToast();
  const uid = user?.id ?? null;
  const load = useMemo(() => (uid ? () => repo.listProjects(uid) : null), [repo, uid]);
  const list = useLoad(load);
  const focusLater = useFocusAfterRender();

  const [editing, setEditing] = useState<Editing | null>(null);
  const [removing, setRemoving] = useState<Project | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [formBusy, setFormBusy] = useState(false);

  const count = list.data?.length ?? 0;
  const full = count >= MAX_PROJECTS;

  const saved = (p: Project, created: boolean) => {
    list.update((l) => (created ? [p, ...l] : l.map((x) => (x.id === p.id ? p : x))));
    setEditing(null);
    toast(created ? 'Projek ditambahkan.' : 'Projek diperbarui.');
    focusLater(`ps2-proj-${p.id}`);
    // Projek pertama memberi poin dan tahap Builder lewat trigger database.
    if (created) void reload();
  };

  const remove = async () => {
    if (!removing) return;
    setBusyDelete(true);
    try {
      await repo.deleteProject(removing.id);
      list.update((l) => l.filter((x) => x.id !== removing.id));
      toast('Projek dihapus.');
      setRemoving(null);
      focusLater('ps2-projects-title');
    } catch (e) {
      toast(errMsg(e, 'Gagal menghapus projek.'), 'error');
    } finally {
      setBusyDelete(false);
    }
  };

  const addButton = (
    <button
      type="button"
      className="ui-btn ui-btn-primary"
      onClick={() => setEditing({ mode: 'new' })}
      disabled={!list.data || full}
    >
      <Icon name="plus" />
      Tambah projek
    </button>
  );

  return (
    <div className="ps2">
      <PageHead
        title="Projek"
        lead="Projek yang Anda kerjakan, sendiri atau bersama tim. Projek pertama memberi +50 poin CATA dan membuka tahap Builder."
      >
        {!loading && !error && addButton}
      </PageHead>
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        <Card
          id="ps2-projects-title"
          title="Projek saya"
          aside={
            list.data ? (
              <span className="ps2-pill">
                {count} dari {MAX_PROJECTS}
              </span>
            ) : undefined
          }
        >
          {list.error ? (
            <ErrorState message={list.error} onRetry={list.retry} />
          ) : !list.data ? (
            <Skeleton rows={3} height={92} label="Memuat projek…" />
          ) : list.data.length === 0 ? (
            <EmptyState
              icon="cube"
              title="Belum ada projek"
              action={
                <button type="button" className="ui-btn ui-btn-primary" onClick={() => setEditing({ mode: 'new' })}>
                  <Icon name="plus" />
                  Tambah projek pertama
                </button>
              }
            >
              Ceritakan projek yang pernah atau sedang Anda kerjakan. Projek pertama membuka tahap Builder di Journey.
            </EmptyState>
          ) : (
            <>
              {full && (
                <p className="ps2-note" style={{ marginBottom: 12 }}>
                  Batas {MAX_PROJECTS} projek tercapai. Hapus projek lama untuk menambah yang baru.
                </p>
              )}
              <ul className="ps2-list ps2-projects">
                {list.data.map((p) => (
                  <ProjectItem
                    key={p.id}
                    p={p}
                    onEdit={() => setEditing({ mode: 'edit', project: p })}
                    onDelete={() => setRemoving(p)}
                  />
                ))}
              </ul>
            </>
          )}
        </Card>

        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={editing?.mode === 'edit' ? 'Ubah projek' : 'Tambah projek'}
          width={600}
          dismissible={!formBusy}
        >
          {editing && (
            <ProjectForm
              key={editing.mode === 'edit' ? editing.project.id : 'new'}
              initial={editing.mode === 'edit' ? editing.project : null}
              onCancel={() => setEditing(null)}
              onSaved={saved}
              onBusy={setFormBusy}
            />
          )}
        </Modal>

        <ConfirmDialog
          open={!!removing}
          title="Hapus projek?"
          message={
            <p>
              “{removing?.title}” akan dihapus dari Passport Anda dan tidak bisa dikembalikan. Poin yang sudah didapat
              tetap tersimpan.
            </p>
          }
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

function ProjectItem({ p, onEdit, onDelete }: { p: Project; onEdit: () => void; onDelete: () => void }) {
  const href = safeHref(p.url);
  const range = fmtRange(p.startedOn, p.endedOn);
  return (
    <li>
      <div className="ps2-proj-top">
        <h3 id={`ps2-proj-${p.id}`} tabIndex={-1}>
          {p.title}
        </h3>
        <div className="ps2-acts">
          <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" onClick={onEdit} aria-label={`Ubah ${p.title}`}>
            <Icon name="pencil" />
            Ubah
          </button>
          <button type="button" className="ui-btn ui-btn-ghost ps2-btn-sm" onClick={onDelete} aria-label={`Hapus ${p.title}`}>
            Hapus
          </button>
        </div>
      </div>
      {(p.role || range || p.collaborators > 0) && (
        <div className="ps2-meta">
          {p.role && <span className="ps2-pill">{p.role}</span>}
          {range && <span>{range}</span>}
          {p.collaborators > 0 && (
            <span>
              <Icon name="users" size={12} /> {fmtNumber(p.collaborators)} kolaborator
            </span>
          )}
        </div>
      )}
      {p.description && <p className="ps2-desc">{p.description}</p>}
      {href && (
        <a className="ps2-link" href={href} target="_blank" rel="noopener noreferrer nofollow">
          Lihat projek
          <Icon name="arrow" />
          <span className="sr-only"> (membuka tab baru)</span>
        </a>
      )}
    </li>
  );
}

type Field = 'title' | 'role' | 'description' | 'startedOn' | 'endedOn' | 'url' | 'collaborators';

function ProjectForm({
  initial,
  onCancel,
  onSaved,
  onBusy,
}: {
  initial: Project | null;
  onCancel: () => void;
  onSaved: (p: Project, created: boolean) => void;
  /** Memberi tahu Modal agar tidak bisa ditutup selama penyimpanan. */
  onBusy: (busy: boolean) => void;
}) {
  const { repo } = usePassport();
  const [v, setV] = useState({
    title: initial?.title ?? '',
    role: initial?.role ?? '',
    description: initial?.description ?? '',
    startedOn: initial?.startedOn ?? '',
    endedOn: initial?.endedOn ?? '',
    url: initial?.url ?? '',
    collaborators: String(initial?.collaborators ?? 0),
  });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    onBusy(busy);
    return () => onBusy(false);
  }, [busy, onBusy]);

  const set = (k: Field) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setV((s) => ({ ...s, [k]: value }));
    if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined }));
  };

  const validate = (): Errors<Field> => {
    const e: Errors<Field> = {
      title: lengthError(v.title, 120, 'Judul', true) ?? undefined,
      role: lengthError(v.role, 60, 'Peran') ?? undefined,
      description: lengthError(v.description, 600, 'Deskripsi') ?? undefined,
      startedOn: dayError(v.startedOn, 'Tanggal mulai') ?? undefined,
      endedOn: dayError(v.endedOn, 'Tanggal selesai') ?? undefined,
      url: urlError(v.url) ?? undefined,
    };
    // Sama dengan CHECK ended_on >= started_on. Format YYYY-MM-DD bisa dibandingkan sebagai teks.
    if (!e.startedOn && !e.endedOn && v.startedOn && v.endedOn && v.endedOn < v.startedOn) {
      e.endedOn = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
    }
    const c = v.collaborators.trim();
    if (c && (!/^\d+$/.test(c) || Number(c) > 100000)) {
      e.collaborators = 'Isi bilangan bulat 0 sampai 100.000.';
    }
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (hasErrors(e)) return;
    const input: ProjectInput = {
      title: v.title.trim(),
      role: orNull(v.role),
      description: orNull(v.description),
      startedOn: v.startedOn || null,
      endedOn: v.endedOn || null,
      url: urlOrNull(v.url),
      collaborators: Number(v.collaborators.trim() || 0),
    };
    setBusy(true);
    setFormError(null);
    try {
      const p = initial ? await repo.updateProject(initial.id, input) : await repo.createProject(input);
      onSaved(p, !initial);
    } catch (err) {
      setFormError(errMsg(err, 'Gagal menyimpan projek.'));
      setBusy(false);
    }
  };

  return (
    <form className="ps2-form" onSubmit={submit} noValidate>
      <FormError message={formError} />
      <TextField
        label="Judul projek"
        value={v.title}
        onChange={set('title')}
        maxLength={120}
        counter
        required
        error={errors.title}
        data-autofocus
      />
      <TextField
        label="Peran Anda"
        hint="Misalnya Ketua tim, Desainer, atau Pengembang."
        value={v.role}
        onChange={set('role')}
        maxLength={60}
        counter
        error={errors.role}
      />
      <TextArea
        label="Deskripsi"
        value={v.description}
        onChange={set('description')}
        maxLength={600}
        counter
        rows={4}
        error={errors.description}
      />
      <div className="ps2-row-2">
        <TextField label="Mulai" type="date" value={v.startedOn} onChange={set('startedOn')} error={errors.startedOn} />
        <TextField
          label="Selesai"
          type="date"
          hint="Kosongkan bila masih berjalan."
          value={v.endedOn}
          onChange={set('endedOn')}
          min={v.startedOn || undefined}
          error={errors.endedOn}
        />
      </div>
      <div className="ps2-row-2">
        <TextField
          label="Tautan projek"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={v.url}
          onChange={set('url')}
          maxLength={500}
          error={errors.url}
        />
        <TextField
          label="Jumlah kolaborator"
          type="number"
          inputMode="numeric"
          min={0}
          max={100000}
          step={1}
          value={v.collaborators}
          onChange={set('collaborators')}
          error={errors.collaborators}
        />
      </div>
      <div className="ui-actions">
        <button type="button" className="ui-btn ui-btn-ghost" onClick={onCancel} disabled={busy}>
          Batal
        </button>
        <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Tambah projek'}</SubmitButton>
      </div>
    </form>
  );
}
