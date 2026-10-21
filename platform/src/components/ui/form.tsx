'use client';

/* ===========================================================
   Primitif formulir untuk seluruh halaman Passport.

   Setiap isian punya <label> yang terhubung, pesan bantuan dan galat
   yang dibacakan lewat aria-describedby, dan batas panjang yang sama
   dengan CHECK di database, supaya pengguna diberi tahu sebelum
   menyimpan, bukan sesudah ditolak server.
   =========================================================== */
import { useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Icon } from './Icon';

interface FieldShell {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  /** Tampilkan hitungan karakter terhadap maxLength. */
  counter?: boolean;
}

function Shell({
  id,
  label,
  hint,
  error,
  children,
  count,
}: FieldShell & { id: string; children: ReactNode; count?: ReactNode }) {
  return (
    <div className={`ui-field${error ? ' has-error' : ''}`}>
      <div className="ui-label-row">
        <label htmlFor={id} className="ui-label">
          {label}
        </label>
        {count}
      </div>
      {children}
      {error ? (
        <p id={`${id}-err`} className="ui-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="ui-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string | null, hint?: ReactNode) {
  return error ? `${id}-err` : hint ? `${id}-hint` : undefined;
}

export function TextField({
  label,
  hint,
  error,
  counter,
  value,
  ...rest
}: FieldShell & Omit<InputHTMLAttributes<HTMLInputElement>, 'value'> & { value: string }) {
  const id = useId();
  const max = rest.maxLength;
  return (
    <Shell
      id={id}
      label={label}
      hint={hint}
      error={error}
      count={counter && max ? <span className="ui-count">{value.length}/{max}</span> : undefined}
    >
      <input
        id={id}
        className="ui-input"
        value={value}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </Shell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  counter,
  value,
  ...rest
}: FieldShell & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'> & { value: string }) {
  const id = useId();
  const max = rest.maxLength;
  return (
    <Shell
      id={id}
      label={label}
      hint={hint}
      error={error}
      count={counter && max ? <span className="ui-count">{value.length}/{max}</span> : undefined}
    >
      <textarea
        id={id}
        className="ui-input ui-textarea"
        value={value}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </Shell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  value,
  onChange,
  options,
}: FieldShell & {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        className="ui-input ui-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy(id, error, hint)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

/** Saklar hidup/mati dengan role="switch". */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="ui-toggle-row">
      <div>
        <label htmlFor={id} className="ui-label">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="ui-hint">
            {hint}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`ui-switch${checked ? ' on' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span />
      </button>
    </div>
  );
}

/**
 * Masukan daftar kata (keahlian, peran). Enter atau koma menambah,
 * Backspace di kolom kosong menghapus yang terakhir.
 */
export function TagInput({
  label,
  hint,
  value,
  onChange,
  max,
  maxLength = 40,
  placeholder,
}: {
  label: string;
  hint?: ReactNode;
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
  maxLength?: number;
  placeholder?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const penuh = value.length >= max;

  function tambah(raw: string) {
    const t = raw.trim().replace(/\s+/g, ' ').slice(0, maxLength);
    if (!t || penuh) return;
    if (value.some((v) => v.toLowerCase() === t.toLowerCase())) return;
    onChange([...value, t]);
    setDraft('');
  }

  return (
    <div className="ui-field">
      <div className="ui-label-row">
        <label htmlFor={id} className="ui-label">
          {label}
        </label>
        <span className="ui-count">
          {value.length}/{max}
        </span>
      </div>
      <div className="ui-tags">
        {value.map((v) => (
          <span key={v} className="ui-tag">
            {v}
            <button type="button" aria-label={`Hapus ${v}`} onClick={() => onChange(value.filter((x) => x !== v))}>
              <Icon name="close" />
            </button>
          </span>
        ))}
        <input
          id={id}
          className="ui-tag-input"
          value={draft}
          maxLength={maxLength}
          placeholder={penuh ? 'Sudah penuh' : placeholder}
          disabled={penuh}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(',')) tambah(v.slice(0, -1));
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              tambah(draft);
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && tambah(draft)}
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="ui-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Tombol pilih berkas. Input berkas asli disembunyikan tetapi tetap
 * bisa dijangkau keyboard lewat tombol yang terlihat.
 */
export function FileButton({
  accept,
  onFile,
  children,
  disabled,
  className = 'ui-btn ui-btn-ghost',
}: {
  accept: string;
  onFile: (f: File) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()} disabled={disabled}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          // Dikosongkan supaya memilih berkas yang sama dua kali tetap memicu onChange.
          e.target.value = '';
          if (f) onFile(f);
        }}
      />
    </>
  );
}

/** Tombol kirim yang menampilkan status sibuk. */
export function SubmitButton({ busy, children, disabled }: { busy?: boolean; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="submit" className="ui-btn ui-btn-primary" disabled={busy || disabled} aria-busy={busy || undefined}>
      {busy ? 'Menyimpan…' : children}
    </button>
  );
}

/** Kotak galat di atas formulir. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="ui-form-error" role="alert">
      <Icon name="alert" />
      <span>{message}</span>
    </div>
  );
}
