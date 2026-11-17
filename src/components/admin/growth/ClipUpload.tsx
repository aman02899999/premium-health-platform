"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import type { ClipRow } from "@/lib/youtube/clips";
import { MAX_CAPTIONS, MAX_CLIP_MB, MAX_CLIP_SECONDS } from "@/lib/youtube/clips-core";

type Loaded = { clips?: ClipRow[]; configured?: boolean; error?: string };
async function fetchClips(): Promise<Loaded> {
  const res = await fetch("/api/admin/youtube/clips", { cache: "no-store" }).catch(() => null);
  const j = (await res?.json().catch(() => null)) as Loaded | null;
  return res?.ok && j ? j : { error: j?.error ?? "Couldn't load clips" };
}
const post = (body: object) => fetch("/api/admin/youtube/clips", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const STATUS: Record<string, string> = { uploading: "Uploading", ready: "Waiting to post (next run, within a few hours)", pending: "Making the video…", published: "On YouTube", failed: "Failed", cancelled: "Cancelled" };

/** "Drop your phone clip": the owner's own recording, captioned, with music and the end card, posted for them. */
export function ClipUpload() {
  const [data, setData] = useState<Loaded>({});
  const [file, setFile] = useState<File | null>(null);
  const [hook, setHook] = useState("");
  const [captions, setCaptions] = useState("");
  const [consent, setConsent] = useState(false);
  const [medical, setMedical] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const reload = useCallback(() => fetchClips().then(setData), []);
  useEffect(() => {
    let live = true;
    fetchClips().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, []);

  const send = async () => {
    setMsg("");
    if (!file) return setMsg("Choose a video first.");
    if (file.size > MAX_CLIP_MB * 1024 * 1024) return setMsg(`That file is ${(file.size / 1048576).toFixed(0)} MB. Keep it under ${MAX_CLIP_MB} MB (about 60 seconds from a phone).`);
    const lines = captions.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > MAX_CAPTIONS) return setMsg(`At most ${MAX_CAPTIONS} caption lines.`);
    if (!consent) return setMsg("Tick the box first.");
    try {
      setBusy("Starting…");
      const start = await post({ action: "start", ext: file.name.split(".").pop() ?? "mp4" });
      const s = (await start.json().catch(() => ({}))) as { id?: string; uploadUrl?: string; error?: string };
      if (!start.ok || !s.id || !s.uploadUrl) return setMsg(s.error ?? "Couldn't start the upload");
      setBusy("Uploading the video…");
      const put = await fetch(s.uploadUrl, { method: "PUT", headers: { "content-type": file.type || "video/mp4", "x-upsert": "true" }, body: file });
      if (!put.ok) return setMsg(`Upload failed (HTTP ${put.status}). Try a smaller file.`);
      setBusy("Saving…");
      const fin = await post({ action: "finish", id: s.id, hook, captions: lines, consent, medical });
      const f = (await fin.json().catch(() => ({}))) as { errors?: string[]; error?: string };
      if (!fin.ok) return setMsg(f.errors?.join(" · ") ?? f.error ?? "Couldn't save");
      setMsg("Saved. It posts to YouTube on the next run (within a few hours), and to Instagram/Facebook once those are connected.");
      setFile(null);
      setHook("");
      setCaptions("");
      setConsent(false);
      setMedical(false);
      void reload();
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <h3 className="text-sm font-bold text-white/80">Post a phone clip</h3>
      <p className="mt-1 text-xs text-white/60">
        Film it vertical, up to {MAX_CLIP_SECONDS} seconds: a form fix, a member&apos;s lift (with their OK), or you reacting to a fitness myth in your own words. The site adds your hook, the caption lines, its own music under your voice and the gym&apos;s end card, then posts it. Only your own recordings: never someone else&apos;s video.
      </p>
      {data.configured === false && <p className="mt-2 text-xs text-amber-200">Supabase Storage isn&apos;t set up on this server, so clips can&apos;t be uploaded yet.</p>}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <label className="block text-xs text-white/60">
          Video (MP4 or MOV, up to {MAX_CLIP_MB} MB)
          <input type="file" accept="video/mp4,video/quicktime,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="field mt-1 text-sm" />
        </label>
        <label className="block text-xs text-white/60">
          Hook, shown for the first 3 seconds ({hook.length}/70)
          <input value={hook} maxLength={70} onChange={(e) => setHook(e.target.value)} placeholder="Squat mein ye galti mat karo" className="field mt-1 text-sm" />
        </label>
        <label className="block text-xs text-white/60 md:col-span-2">
          Caption lines, one per line, up to {MAX_CAPTIONS} (shown one after another)
          <textarea value={captions} rows={4} onChange={(e) => setCaptions(e.target.value)} placeholder={"Ghutne andar mat aane do\nChest upar, kamar seedhi"} className="field mt-1 text-sm" />
        </label>
        <label className="flex items-start gap-2 text-xs text-white/75 md:col-span-2">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          This is my own recording. Everyone who can be seen or heard in it agreed to be posted. It has no other creator&apos;s video or music in it.
        </label>
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input type="checkbox" checked={medical} onChange={(e) => setMedical(e.target.checked)} /> Talks about a health condition (adds &quot;ask your doctor&quot;)
        </label>
      </div>
      <button type="button" disabled={!!busy} onClick={send} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
        <Upload className="h-3.5 w-3.5" /> {busy || "Upload and post"}
      </button>
      {msg && <p className="mt-2 text-xs text-white/75">{msg}</p>}
      {data.error && <p className="mt-2 text-xs text-amber-200">{data.error}</p>}
      {!!data.clips?.length && (
        <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10">
          {data.clips.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 p-3 text-xs">
              <span className="min-w-0 flex-1 truncate text-sm text-white/85">{c.hook || "(not saved)"}</span>
              <span className={c.status === "failed" ? "text-rose-300" : c.status === "published" ? "text-emerald-300" : "text-white/60"} title={c.error ?? undefined}>
                {STATUS[c.status] ?? c.status}
                {c.status === "failed" && c.error ? `: ${c.error}` : ""}
              </span>
              {c.youtubeUrl && (
                <a href={c.youtubeUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-300 hover:underline">
                  YouTube ↗
                </a>
              )}
              {c.reelPermalink && (
                <a href={c.reelPermalink} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-300 hover:underline">
                  Reel ↗
                </a>
              )}
              {c.status === "published" && !c.reelPermalink && <span className="text-white/45">{c.reelStatus ? `Reel: ${c.reelStatus}` : "Reel: waits for Instagram/Facebook"}</span>}
              {c.status === "failed" && (
                <button type="button" onClick={() => post({ action: "retry", id: c.id }).then(reload)} className="rounded bg-white/10 px-2 py-1 font-semibold text-white/80 hover:bg-white/20">
                  Try again
                </button>
              )}
              {(c.status === "ready" || c.status === "failed") && (
                <button type="button" onClick={() => post({ action: "cancel", id: c.id }).then(reload)} className="rounded bg-white/10 px-2 py-1 font-semibold text-white/80 hover:bg-white/20">
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
