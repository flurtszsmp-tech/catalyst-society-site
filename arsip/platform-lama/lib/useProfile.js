"use client";

import { useEffect, useState, useCallback } from "react";
import { db, SUPABASE_SIAP, wajibLogin } from "./supabase";
import { getDemoData, updateDemoProfil } from "./demo-data";

export function useProfile() {
  const [state, setState] = useState({
    loading: true,
    demo: !SUPABASE_SIAP,
    user: null,
    prof: null,
    belumLogin: false,
  });

  const muat = useCallback(async () => {
    if (!SUPABASE_SIAP) {
      setState({ loading: false, demo: true, user: null, prof: getDemoData().profil, belumLogin: false });
      return;
    }
    const user = await wajibLogin();
    if (!user) {
      setState({ loading: false, demo: false, user: null, prof: null, belumLogin: true });
      return;
    }
    const { data: prof } = await db.from("profiles").select("*").eq("id", user.id).single();
    setState({ loading: false, demo: false, user, prof, belumLogin: false });
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  const updateProfile = useCallback(
    async (partial) => {
      if (state.demo) {
        const prof = updateDemoProfil(partial);
        setState((s) => ({ ...s, prof }));
        return { error: null };
      }
      if (!db || !state.user) return { error: "Belum login." };
      const { data: prof, error } = await db
        .from("profiles")
        .update(partial)
        .eq("id", state.user.id)
        .select()
        .single();
      if (error) return { error: error.message };
      setState((s) => ({ ...s, prof }));
      return { error: null };
    },
    [state.demo, state.user]
  );

  return { ...state, updateProfile, muatUlang: muat };
}
