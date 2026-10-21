'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { FormError, SelectField, SubmitButton, TextArea, TextField } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { CHANNELS } from '@/lib/data/communities';
import { LINK_KEYS, type Channel, type LinkKey, type Profile } from '@/lib/types';
import { errorText, useCompletionReward, useUnsavedGuard } from './hooks';
import { LinkField } from './LinkField';
import { canonicalLink, linkError, resolveLink } from './links';

type Links = Record<LinkKey, string>;
type LinkErrors = Partial<Record<LinkKey, string>>;

interface Draft {
  fullName: string;
  headline: string;
  location: string;
  about: string;
  channel: string;
  links: Links;
}

const CHANNEL_OPTIONS = [
  { value: 'none', label: 'Belum memilih kanal' },
  ...CHANNELS.map((c) => ({ value: c.key, label: c.label.id })),
];

function draftOf(p: Profile): Draft {
  const links = {} as Links;
  for (const k of LINK_KEYS) links[k] = p.links[k] ?? '';
  return {
    fullName: p.fullName,
    headline: p.headline ?? '',
    location: p.location ?? '',
    about: p.about ?? '',
    channel: p.channel ?? 'none',
    links,
  };
}

/** Spasi di tepi tidak dihitung perubahan, karena memang dibuang saat simpan. */
function sameDraft(a: Draft, b: Draft): boolean {
  return (
    a.fullName.trim() === b.fullName.trim() &&
    a.headline.trim() === b.headline.trim() &&
    a.location.trim() === b.location.trim() &&
    a.about.trim() === b.about.trim() &&
    a.channel === b.channel &&
    LINK_KEYS.every((k) => canonicalLink(k, a.links[k]) === canonicalLink(k, b.links[k]))
  );
}

function dropKey(errs: LinkErrors, k: LinkKey): LinkErrors {
  if (!(k in errs)) return errs;
  const n = { ...errs };
  delete n[k];
  return n;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  const reward = useCompletionReward();
  const [d, setD] = useState<Draft>(() => draftOf(profile));
  const [linkErr, setLinkErr] = useState<LinkErrors>({});
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Chip tautan kosong di dasbor menuju /passport/profile#tautan. Isi
  // halaman baru ada sesudah profil dimuat, jadi lompatannya dilakukan di sini.
  useEffect(() => {
    if (window.location.hash !== '#tautan') return;
    const el = document.getElementById('tautan');
    el?.scrollIntoView({ block: 'start' });
    el?.focus({ preventScroll: true });
  }, []);

  // Pembanding diambil dari profil terkini, jadi sesudah setProfile tombol
  // Simpan otomatis kembali nonaktif tanpa status tambahan.
  const dirty = !sameDraft(d, draftOf(profile));
  useUnsavedGuard(dirty);

  function set<K extends Exclude<keyof Draft, 'links'>>(key: K, v: Draft[K]) {
    setD((s) => ({ ...s, [key]: v }));
  }

  function setLink(k: LinkKey, v: string) {
    setD((s) => ({ ...s, links: { ...s.links, [k]: v } }));
    // Galat hilang begitu isian sudah bisa dipakai, tidak perlu menunggu blur.
    if (linkErr[k] && resolveLink(k, v) !== null) setLinkErr((e) => dropKey(e, k));
  }

  function blurLink(k: LinkKey) {
    const r = resolveLink(k, d.links[k]);
    if (r === null) {
      setLinkErr((e) => ({ ...e, [k]: linkError(k) }));
      return;
    }
    setLinkErr((e) => dropKey(e, k));
    if (r !== d.links[k]) setLink(k, r);
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (busy || !dirty) return;
    setErr(null);

    const name = d.fullName.trim();
    const errs: LinkErrors = {};
    const links: Partial<Record<LinkKey, string>> = {};
    for (const k of LINK_KEYS) {
      const r = resolveLink(k, d.links[k]);
      if (r === null) errs[k] = linkError(k);
      else if (r) links[k] = r;
    }
    setLinkErr(errs);
    setNameErr(name ? null : 'Nama wajib diisi.');
    if (!name || Object.keys(errs).length) {
      setErr('Periksa isian yang ditandai merah, lalu simpan lagi.');
      return;
    }

    setBusy(true);
    try {
      const updated = await repo.updateMyProfile({
        fullName: name,
        headline: d.headline.trim() || null,
        location: d.location.trim() || null,
        about: d.about.trim() || null,
        channel: d.channel === 'none' ? null : (d.channel as Channel),
        // Kanal yang dikosongkan tidak dikirim sama sekali, sehingga terhapus.
        links,
      });
      setProfile(updated);
      setD(draftOf(updated));
      toast('Profil disimpan.', 'ok');
      void reward(profile, updated);
    } catch (e2) {
      setErr(errorText(e2, 'Gagal menyimpan profil. Coba lagi.'));
    } finally {
      setBusy(false);
    }
  }

  function batal() {
    setD(draftOf(profile));
    setLinkErr({});
    setNameErr(null);
    setErr(null);
  }

  return (
    <form className="pf-form" onSubmit={(e) => void simpan(e)} noValidate aria-busy={busy || undefined}>
      {/* fieldset disabled mengunci semua isian selama penyimpanan, supaya
          ketikan baru tidak tertimpa hasil dari server. */}
      <fieldset className="pf-fieldset" disabled={busy}>
        <section className="pf-card" aria-labelledby="pf-info-h">
          <div className="pf-card-head">
            <div>
              <h2 id="pf-info-h">Tentang Anda</h2>
              <p>Tampil di kartu Passport dan halaman profil publik Anda.</p>
            </div>
          </div>
          <div className="pf-fields">
            <TextField
              label="Nama lengkap"
              value={d.fullName}
              onChange={(e) => {
                set('fullName', e.target.value);
                if (nameErr && e.target.value.trim()) setNameErr(null);
              }}
              maxLength={80}
              counter
              required
              autoComplete="name"
              error={nameErr}
            />
            <TextField
              label="Headline"
              hint="Satu kalimat tentang apa yang Anda kerjakan, mis. “Analis data di fintech, belajar AI.”"
              value={d.headline}
              onChange={(e) => set('headline', e.target.value)}
              maxLength={120}
              counter
            />
            <div className="pf-grid">
              <TextField
                label="Lokasi"
                placeholder="Jakarta, Indonesia"
                value={d.location}
                onChange={(e) => set('location', e.target.value)}
                maxLength={80}
                counter
                autoComplete="address-level2"
              />
              <SelectField
                label="Kanal utama"
                hint="Kanal Catalyst yang paling dekat dengan minat Anda."
                value={d.channel}
                onChange={(v) => set('channel', v)}
                options={CHANNEL_OPTIONS}
              />
            </div>
            <TextArea
              label="Tentang"
              hint="Ceritakan latar belakang, minat, dan apa yang sedang Anda cari."
              value={d.about}
              onChange={(e) => set('about', e.target.value)}
              maxLength={1200}
              counter
              rows={6}
            />
          </div>
        </section>

        <section className="pf-card" id="tautan" tabIndex={-1} aria-labelledby="pf-link-h">
          <div className="pf-card-head">
            <div>
              <h2 id="pf-link-h">Tautan sosial</h2>
              <p>
                Isi nama pengguna seperti @nama, sebagian alamat, atau URL lengkap; semuanya dirapikan otomatis.
                Kosongkan kolom untuk menghapus tautan dari profil.
              </p>
            </div>
          </div>
          <div className="pf-grid">
            {LINK_KEYS.map((k) => (
              <LinkField
                key={k}
                kind={k}
                value={d.links[k]}
                error={linkErr[k]}
                disabled={busy}
                onChange={(v) => setLink(k, v)}
                onBlur={() => blurLink(k)}
              />
            ))}
          </div>
        </section>

        <div className={`pf-savebar${dirty ? ' is-dirty' : ''}`}>
          <FormError message={err} />
          <div className="pf-savebar-row">
            <p className="pf-savebar-status" aria-live="polite">
              {dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'}
            </p>
            <div className="pf-btns">
              {dirty && (
                <button type="button" className="ui-btn ui-btn-ghost" onClick={batal} disabled={busy}>
                  Batalkan
                </button>
              )}
              <SubmitButton busy={busy} disabled={!dirty}>
                Simpan perubahan
              </SubmitButton>
            </div>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
