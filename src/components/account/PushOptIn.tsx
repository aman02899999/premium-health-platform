"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";

// Free app notifications: the member turns them on for this phone or browser. Nothing is asked
// until they tap the button, and the card stays hidden until the site's keys are set.

type State = "loading" | "hidden" | "unsupported" | "ios-install" | "blocked" | "off" | "on";

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(path, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = (await res.json().catch(() => ({}))) as { error?: string; available?: boolean; publicKey?: string | null };
  if (!res.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}

export function PushOptIn() {
  const [state, setState] = useState<State>("loading");
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const info = await call("GET", "/api/account/push").catch(() => null);
      if (!info?.available || !info.publicKey) return setState("hidden");
      setKey(info.publicKey);
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setState(isIos() && !isInstalled() ? "ios-install" : "unsupported");
      }
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub && Notification.permission === "granted") {
        // Keep the server in step (the same browser may have been switched off on the server).
        await call("POST", "/api/account/push", { subscription: sub.toJSON() }).catch(() => {});
        return setState("on");
      }
      setState("off");
    })();
  }, []);

  async function turnOn() {
    if (!key) return;
    setBusy(true);
    setNote(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
      await call("POST", "/api/account/push", { subscription: sub.toJSON() });
      setState("on");
      setNote("Done. Tap “Send me a test” to check it reaches this phone.");
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setNote(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await call("DELETE", "/api/account/push", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setState("off");
      setNote("Notifications are off on this phone.");
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setNote(null);
    try {
      await call("POST", "/api/account/push/test");
      setNote("Sent. It should show up in a few seconds.");
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "hidden") return null;

  return (
    <div className="glass brand-border rounded-3xl p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/20">
          {state === "on" ? <Bell className="h-6 w-6 text-brand" /> : <BellOff className="h-6 w-6 text-brand" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl text-white">App notifications</p>
          <p className="text-sm text-white/60">
            {state === "on" && "On for this phone. We'll tell you here when your diet or workout plan is ready. No offers."}
            {state === "off" && "Get a note on this phone when your diet or workout plan is ready. No offers, and you can turn it off any time."}
            {state === "blocked" && "Notifications are blocked for this site. Allow them in your browser or phone settings, then come back here."}
            {state === "unsupported" && "This browser can't show notifications. Try Chrome, or the Royal Fitness app."}
            {state === "ios-install" && "On iPhone, first add this site to your Home Screen (Share → Add to Home Screen), open it from there, then turn notifications on."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {state === "off" && (
              <button type="button" onClick={turnOn} disabled={busy} className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-2 font-bold disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Turn on notifications
              </button>
            )}
            {state === "on" && (
              <>
                <button type="button" onClick={sendTest} disabled={busy} className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-2 font-bold disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send me a test
                </button>
                <button type="button" onClick={turnOff} disabled={busy} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/70 ring-1 ring-white/20 hover:text-white">
                  <BellOff className="h-4 w-4" /> Turn off
                </button>
              </>
            )}
          </div>
          {note && (
            <p role="status" className="mt-3 text-sm text-white/75">
              {note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
