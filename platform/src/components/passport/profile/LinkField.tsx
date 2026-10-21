'use client';

import { useId, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { LinkKey } from '@/lib/types';
import { LINK_META, resolveLink } from './links';

/**
 * Satu kanal sosial. Pengguna boleh mengetik "@nama", "nama",
 * "instagram.com/nama", atau URL lengkap; saat fokus lepas, isinya
 * diganti URL hasil normalisasi supaya yang disimpan terlihat jelas.
 */
export function LinkField({
  kind,
  value,
  error,
  disabled,
  onChange,
  onBlur,
}: {
  kind: LinkKey;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = useId();
  const meta = LINK_META[kind];
  const url = error ? null : resolveLink(kind, value);
  const ketik = value.trim();

  let hint: ReactNode;
  if (!ketik) hint = 'Kosong, tidak tampil di profil.';
  else if (url && url !== ketik)
    hint = (
      <>
        Akan disimpan sebagai <span className="pf-link-url">{url}</span>
      </>
    );
  else if (url)
    hint = (
      <a className="pf-link-open" href={url} target="_blank" rel="noopener noreferrer">
        Buka tautan
        <Icon name="arrow" />
        <span className="sr-only"> (tab baru)</span>
      </a>
    );

  return (
    <div className={`ui-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id} className="ui-label pf-link-label">
        <Icon name={meta.icon} />
        {meta.label}
      </label>
      <input
        id={id}
        className="ui-input"
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={500}
        placeholder={meta.placeholder}
        value={value}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error ? (
        <p id={`${id}-err`} className="ui-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="ui-hint pf-link-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
