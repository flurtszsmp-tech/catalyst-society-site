'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { FormError, SubmitButton, TagInput } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { CHANNELS } from '@/lib/data/communities';
import type { Channel, Profile } from '@/lib/types';
import { errorText, isProfileComplete, useCompletionReward, useUnsavedGuard } from './hooks';

const MAX_SKILLS = 20;
const MAX_ROLES = 10;
const MAX_LEN = 40;

/** Saran awal per kanal. Hanya titik mulai; pengguna bebas mengetik apa pun. */
const SARAN: Record<Channel, { skills: string[]; roles: string[] }> = {
  investments: {
    skills: ['Analisis Fundamental', 'Analisis Teknikal', 'Valuasi Perusahaan', 'Manajemen Risiko', 'Financial Modeling', 'Aset Kripto', 'Riset Pasar'],
    roles: ['Analis Investasi', 'Riset Ekuitas', 'Trader', 'Venture Scout'],
  },
  ai: {
    skills: ['Python', 'Machine Learning', 'Prompt Engineering', 'Analisis Data', 'Deep Learning', 'SQL', 'Aplikasi LLM'],
    roles: ['AI Engineer', 'Data Scientist', 'ML Researcher', 'Data Analyst'],
  },
  business: {
    skills: ['Strategi Bisnis', 'Pemasaran Digital', 'Public Speaking', 'Negosiasi', 'Manajemen Proyek', 'Riset Pengguna', 'Penjualan'],
    roles: ['Founder', 'Business Development', 'Product Manager', 'Marketing Lead'],
  },
  builder: {
    skills: ['Pengembangan Web', 'React', 'Desain UI/UX', 'Figma', 'Smart Contract', 'Node.js', 'Aplikasi Mobile'],
    roles: ['Software Engineer', 'Product Designer', 'Full-stack Developer', 'Web3 Builder'],
  },
  impact: {
    skills: ['Pengembangan Komunitas', 'Penulisan Proposal Hibah', 'Advokasi Kebijakan', 'Manajemen Relawan', 'Keberlanjutan (ESG)', 'Fasilitasi Workshop'],
    roles: ['Community Lead', 'Relawan', 'Social Entrepreneur', 'Peneliti Kebijakan'],
  },
};

function has(list: string[], v: string) {
  return list.some((x) => x.toLowerCase() === v.toLowerCase());
}

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Tombol saran: ditekan menambah, ditekan lagi melepas. */
function Chips({
  items,
  value,
  max,
  onChange,
  label,
}: {
  items: string[];
  value: string[];
  max: number;
  onChange: (v: string[]) => void;
  label: string;
}) {
  const penuh = value.length >= max;
  return (
    <div className="pf-chips" role="group" aria-label={label}>
      {items.map((s) => {
        const on = has(value, s);
        return (
          <button
            key={s}
            type="button"
            className="pf-chip"
            aria-pressed={on}
            disabled={!on && penuh}
            onClick={() => onChange(on ? value.filter((x) => x.toLowerCase() !== s.toLowerCase()) : [...value, s])}
          >
            <Icon name={on ? 'check' : 'plus'} />
            {s}
          </button>
        );
      })}
    </div>
  );
}

export function SkillsForm({ profile }: { profile: Profile }) {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  const reward = useCompletionReward();
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [roles, setRoles] = useState<string[]>(profile.roles);
  const [kanal, setKanal] = useState<Channel>(profile.channel ?? 'investments');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty = !sameList(skills, profile.skills) || !sameList(roles, profile.roles);
  useUnsavedGuard(dirty);

  const syarat = [
    { ok: !!(profile.avatarPath || profile.avatarUrl), label: 'Foto profil', href: '/passport/profile' },
    { ok: !!profile.headline?.trim(), label: 'Headline', href: '/passport/profile' },
    { ok: !!profile.about?.trim(), label: 'Bagian Tentang', href: '/passport/profile' },
    { ok: skills.length >= 3, label: `Minimal 3 keahlian (sekarang ${skills.length})`, href: null },
  ];
  const sudahLengkap = isProfileComplete(profile);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (busy || !dirty) return;
    setErr(null);
    setBusy(true);
    try {
      const updated = await repo.updateMyProfile({ skills, roles });
      setProfile(updated);
      setSkills(updated.skills);
      setRoles(updated.roles);
      toast('Keahlian dan peran disimpan.', 'ok');
      void reward(profile, updated);
    } catch (e2) {
      setErr(errorText(e2, 'Gagal menyimpan keahlian. Coba lagi.'));
    } finally {
      setBusy(false);
    }
  }

  const saran = SARAN[kanal];

  return (
    <form className="pf-form" onSubmit={(e) => void simpan(e)} aria-busy={busy || undefined}>
      {/* fieldset disabled mengunci semua isian selama penyimpanan, supaya
          ketikan baru tidak tertimpa hasil dari server. */}
      <fieldset className="pf-fieldset" disabled={busy}>
        <section className="pf-card" aria-labelledby="pf-lengkap-h">
          <div className="pf-card-head">
            <div>
              <h2 id="pf-lengkap-h">{sudahLengkap ? 'Profil Anda sudah lengkap' : 'Lengkapi profil, dapat poin'}</h2>
              <p>
                Profil dianggap lengkap bila ada foto, headline, bagian Tentang, dan minimal 3 keahlian. Saat pertama kali
                lengkap, Anda mendapat +30 CATA points. Poin ini diberikan sekali saja.
              </p>
            </div>
          </div>
          <ul className="pf-check">
            {syarat.map((s) => (
              <li key={s.label} className={s.ok ? 'is-done' : undefined}>
                <Icon name={s.ok ? 'check' : 'target'} />
                <span>
                  {s.label}
                  <span className="sr-only">{s.ok ? ': sudah' : ': belum'}</span>
                </span>
                {!s.ok && s.href && (
                  <Link href={s.href} className="pf-check-go">
                    Isi di Profil
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="pf-card" aria-labelledby="pf-skill-h">
          <div className="pf-card-head">
            <div>
              <h2 id="pf-skill-h">Keahlian & peran</h2>
              <p>Ketik lalu tekan Enter atau koma untuk menambah. Backspace di kolom kosong menghapus yang terakhir.</p>
            </div>
          </div>

          <div className="pf-fields">
            <TagInput
              label="Keahlian"
              hint={`Maksimal ${MAX_SKILLS} keahlian, masing-masing ${MAX_LEN} karakter.`}
              value={skills}
              onChange={setSkills}
              max={MAX_SKILLS}
              maxLength={MAX_LEN}
              placeholder="mis. Analisis Data"
            />
            <TagInput
              label="Peran"
              hint={`Peran yang sedang atau ingin Anda jalani. Maksimal ${MAX_ROLES}.`}
              value={roles}
              onChange={setRoles}
              max={MAX_ROLES}
              maxLength={MAX_LEN}
              placeholder="mis. Product Manager"
            />
          </div>

          <div className="pf-sep">
            <fieldset className="pf-seg-set">
              <legend className="ui-label">Saran dari kanal</legend>
              <div className="pf-seg">
                {CHANNELS.map((c) => (
                  <label key={c.key} className={`pf-seg-opt${kanal === c.key ? ' on' : ''}`}>
                    <input
                      type="radio"
                      name="pf-saran-kanal"
                      value={c.key}
                      checked={kanal === c.key}
                      onChange={() => setKanal(c.key)}
                    />
                    {c.label.id}
                    {profile.channel === c.key && <span className="pf-seg-tag">kanal Anda</span>}
                  </label>
                ))}
              </div>
          </fieldset>

          <p className="pf-sub">Keahlian</p>
          <Chips items={saran.skills} value={skills} max={MAX_SKILLS} onChange={setSkills} label="Saran keahlian" />
          <p className="pf-sub">Peran</p>
          <Chips items={saran.roles} value={roles} max={MAX_ROLES} onChange={setRoles} label="Saran peran" />
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
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                disabled={busy}
                onClick={() => {
                  setSkills(profile.skills);
                  setRoles(profile.roles);
                  setErr(null);
                }}
              >
                Batalkan
              </button>
            )}
            <SubmitButton busy={busy} disabled={!dirty}>
              Simpan
            </SubmitButton>
          </div>
        </div>
      </div>
      </fieldset>
    </form>
  );
}
