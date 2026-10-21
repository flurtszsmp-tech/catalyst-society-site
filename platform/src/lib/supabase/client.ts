'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env';

let klien: SupabaseClient | null = null;

/**
 * Klien Supabase untuk komponen browser. Satu instans dipakai bersama
 * di seluruh tab supaya hanya ada satu pengurus sesi yang memperbarui
 * token. Mengembalikan null dalam mode demo.
 *
 * Passport diterbitkan sebagai halaman statis, jadi sesi disimpan di
 * localStorage (bukan cookie) dengan kunci bawaan supabase-js, sama dengan
 * halaman masuk landing (login.html). Dengan begitu sesi dari masuk
 * dengan kata sandi, link email, atau atur ulang kata sandi langsung
 * terbaca di Passport.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!klien) {
    klien = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return klien;
}
