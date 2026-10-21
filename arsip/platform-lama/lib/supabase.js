import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const SUPABASE_SIAP = URL.indexOf("http") === 0 && ANON_KEY.length > 20;

export const db = SUPABASE_SIAP ? createClient(URL, ANON_KEY) : null;

export async function wajibLogin() {
  if (!db) return null;
  const { data } = await db.auth.getSession();
  return data.session ? data.session.user : null;
}

export async function keluar() {
  if (db) await db.auth.signOut();
}
