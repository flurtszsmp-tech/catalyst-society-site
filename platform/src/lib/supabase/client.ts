'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env';

let klien: SupabaseClient | null = null;

/**
 * Klien Supabase untuk komponen browser. Satu instans dipakai bersama
 * di seluruh tab supaya hanya ada satu pengurus sesi yang memperbarui
 * token. Mengembalikan null dalam mode demo.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!klien) klien = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return klien;
}
