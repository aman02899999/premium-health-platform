"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { SYNC_KEYS, type SyncKey } from "@/lib/supabase/config";
import { OWNER_KEY, localBelongsTo } from "@/lib/member-data";

const isSyncKey = (key: string): key is SyncKey => (SYNC_KEYS as readonly string[]).includes(key);

function readLocal(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

/**
 * useState persisted to localStorage, and — for signed-in members — synced to
 * Supabase (public.user_data) so it follows them across devices.
 *
 * Data on this device is tagged with the account it belongs to (OWNER_KEY). Data saved while
 * signed out goes to whoever signs in next; data from another account is never shown or
 * uploaded, so a shared phone can't mix two people's logs. On sign-in the account's copy wins,
 * unless `merge` says how to combine it with what was saved on this device while signed out.
 */
export function useStored<T>(key: string, initial: T, merge?: (cloud: T, local: T) => T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  const cloudUser = useRef<string | null>(null);
  // The last value known to match the cloud copy, so loading it doesn't write it straight back.
  const synced = useRef<string | null>(null);
  const mergeRef = useRef(merge);

  useEffect(() => {
    const owner = (() => {
      try {
        return localStorage.getItem(OWNER_KEY);
      } catch {
        return null;
      }
    })();
    const local = readLocal(key) as T | undefined;
    // Signed-out data shows at once; another account's data waits until we know who this is.
    if (local !== undefined && !owner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount to avoid SSR mismatch
      setValue(local);
    }

    const supabase = getBrowserClient();
    if (!supabase || !isSyncKey(key)) {
      if (local !== undefined && owner) setValue(local);
      loaded.current = true;
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (cancelled) return;
      const user = auth.user;
      const mine = user ? localBelongsTo(owner, user.id) : !owner;
      if (!mine) {
        // Someone else's saved data (they signed out, or another account is signed in): drop it.
        writeLocal(key, null);
        setValue(initial);
      } else if (local !== undefined && owner) setValue(local);
      if (!user) {
        if (owner) writeLocal(OWNER_KEY, null);
        loaded.current = true;
        return;
      }
      const { data, error } = await supabase.from("user_data").select("value").eq("key", key).maybeSingle();
      if (cancelled) return;
      loaded.current = true;
      if (error) return;
      cloudUser.current = user.id;
      writeLocal(OWNER_KEY, user.id);
      const localMine = mine ? local : undefined;
      if (data) {
        const cloud = data.value as T;
        const next = localMine !== undefined && mergeRef.current ? mergeRef.current(cloud, localMine) : cloud;
        // Only the cloud copy counts as synced; a merged value still needs uploading.
        synced.current = JSON.stringify(cloud);
        setValue(next);
      } else if (localMine !== undefined) {
        await supabase.from("user_data").upsert({ user_id: user.id, key, value: localMine });
        synced.current = JSON.stringify(localMine);
      }
    })();
    return () => {
      cancelled = true;
    };
    // `initial` is a fresh literal each render; only the key decides what is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    const json = JSON.stringify(value);
    writeLocal(key, json);
    const userId = cloudUser.current;
    const supabase = getBrowserClient();
    if (!userId || !supabase || !isSyncKey(key) || json === synced.current) return;
    // Debounce cloud writes so typing in a field doesn't send a request per keystroke.
    const t = setTimeout(() => {
      supabase
        .from("user_data")
        .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.warn("[sync]", error.message);
          else synced.current = json;
        });
    }, 800);
    return () => clearTimeout(t);
  }, [key, value]);

  return [value, setValue] as const;
}
