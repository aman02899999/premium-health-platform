"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { SYNC_KEYS, type SyncKey } from "@/lib/supabase/config";

const isSyncKey = (key: string): key is SyncKey => (SYNC_KEYS as readonly string[]).includes(key);

/**
 * useState persisted to localStorage, and — for signed-in members — synced to
 * Supabase (public.user_data) so it follows them across devices.
 * On sign-in the cloud copy wins; if there is none yet, the local copy is uploaded.
 */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  const cloudUser = useRef<string | null>(null);
  const hadLocal = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        hadLocal.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount to avoid SSR mismatch
        setValue(JSON.parse(raw));
      }
    } catch {
      /* storage unavailable */
    }
    loaded.current = true;

    const supabase = getBrowserClient();
    if (!supabase || !isSyncKey(key)) return;
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user || cancelled) return;
      const { data, error } = await supabase.from("user_data").select("value").eq("key", key).maybeSingle();
      if (error || cancelled) return;
      cloudUser.current = user.id;
      if (data) setValue(data.value as T);
      else if (hadLocal.current) {
        const raw = localStorage.getItem(key);
        if (raw) await supabase.from("user_data").upsert({ user_id: user.id, key, value: JSON.parse(raw) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
    const userId = cloudUser.current;
    const supabase = getBrowserClient();
    if (!userId || !supabase || !isSyncKey(key)) return;
    // Debounce cloud writes so typing in a field doesn't send a request per keystroke.
    const t = setTimeout(() => {
      supabase
        .from("user_data")
        .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() })
        .then(({ error }) => error && console.warn("[sync]", error.message));
    }, 800);
    return () => clearTimeout(t);
  }, [key, value]);

  return [value, setValue] as const;
}
