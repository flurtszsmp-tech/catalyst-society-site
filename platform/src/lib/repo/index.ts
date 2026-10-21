'use client';

import { isSupabaseConfigured } from '@/lib/env';
import { DemoRepo } from './demo';
import { SupabaseRepo } from './supabase';
import type { PassportRepo } from './types';

export type { PassportRepo } from './types';
export { RepoError, LIMITS, SLUG_PATTERN } from './types';

let repo: PassportRepo | null = null;

/**
 * Repo untuk browser. Supabase bila kredensialnya terisi, demo bila
 * tidak. Satu instans per tab, supaya DemoRepo tidak memuat ulang
 * localStorage di setiap komponen dan saling menimpa.
 */
export function getRepo(): PassportRepo {
  if (!repo) repo = isSupabaseConfigured ? new SupabaseRepo() : new DemoRepo();
  return repo;
}
