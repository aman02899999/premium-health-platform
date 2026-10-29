"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, MonitorSmartphone } from "lucide-react";

const STANDALONE = "(display-mode: standalone)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(STANDALONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Install from the browser": Chrome and Edge offer a real install prompt; the button only shows
 * when the browser does. Safari has no prompt, so iPhone users get the Add to Home Screen steps.
 */
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [justInstalled, setInstalled] = useState(false);
  // Already running as the installed app (or inside the Android app).
  const standalone = useSyncExternalStore(subscribe, () => window.matchMedia(STANDALONE).matches, () => false);
  const installed = standalone || justInstalled;

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
        <Check className="h-4 w-4" /> Installed on this device
      </p>
    );
  }
  if (!prompt) {
    return <p className="text-sm text-white/60">Open this page in Chrome or Edge to see the install button, or use your browser menu: &ldquo;Install app&rdquo; / &ldquo;Add to Home screen&rdquo;.</p>;
  }
  return (
    <button
      type="button"
      onClick={async () => {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") setInstalled(true);
        setPrompt(null);
      }}
      className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold"
    >
      <MonitorSmartphone className="h-4 w-4" /> Install on this device
    </button>
  );
}
