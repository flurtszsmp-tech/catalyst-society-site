'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Profile } from '@/lib/types';
import { Avatar } from '../cards/Avatar';

interface Props {
  profile: Profile | null;
  demo: boolean;
  menuOpen: boolean;
  onMenu: () => void;
}

export function Topbar({ profile, demo, menuOpen, onMenu }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <header className="pass-top">
      <button
        type="button"
        className="pass-burger"
        aria-label="Buka menu"
        aria-controls="pass-side"
        aria-expanded={menuOpen}
        onClick={onMenu}
      >
        <Icon name="menu" />
      </button>

      {/* Pencarian orang diarahkan ke Connections, tempat hasil dan tombol ikuti berada. */}
      <form
        className="pass-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const v = q.trim();
          router.push(v ? `/passport/connections?q=${encodeURIComponent(v)}` : '/passport/connections');
        }}
      >
        <Icon name="search" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people, skills, communities, or projects…"
          aria-label="Cari orang"
          maxLength={60}
        />
      </form>

      <div className="pass-top-right">
        {demo && (
          <span className="pass-demo" title="Supabase belum dikonfigurasi. Data disimpan di browser ini saja.">
            Mode demo
          </span>
        )}
        {/* Belum ada sumber notifikasi dan pesan; tombolnya ada tanpa angka palsu. */}
        <button type="button" className="pass-icobtn" aria-label="Notifikasi (belum ada)" disabled>
          <Icon name="bell" />
        </button>
        <button type="button" className="pass-icobtn" aria-label="Pesan (segera hadir)" disabled>
          <Icon name="chat" />
        </button>
        <span className="pass-sep" aria-hidden />
        {profile && (
          <Link href="/passport/profile" className="pass-me" aria-label={`Profil ${profile.fullName}`}>
            <Avatar person={profile} size={72} />
            <span className="pass-me-txt">
              <b>{profile.fullName}</b>
              <span>{profile.catalystId}</span>
            </span>
            <Icon name="chevron" className="chev" />
          </Link>
        )}
      </div>
    </header>
  );
}
