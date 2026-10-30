"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> };
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "code_128", "data_matrix"];

/**
 * The phone's back camera, reading barcodes and QR codes. Uses the browser's own reader where there is
 * one (Android Chrome) and a JavaScript reader elsewhere (iPhone). The same code isn't reported twice
 * within two seconds, so holding a pack in view doesn't count it over and over.
 */
export function CameraScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const report = useRef(onCode);
  const [status, setStatus] = useState<"starting" | "on" | "error">("starting");
  const [error, setError] = useState("");

  useEffect(() => {
    report.current = onCode;
  }, [onCode]);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let zxingStop: (() => void) | undefined;
    let last = { code: "", at: 0 };
    const seen = (code: string) => {
      const now = Date.now();
      if (code === last.code && now - last.at < 2000) return;
      last = { code, at: now };
      navigator.vibrate?.(60);
      report.current(code);
    };

    (async () => {
      try {
        const el = video.current!;
        const Native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
        const supported = Native ? await Native.getSupportedFormats?.().catch(() => []) : [];
        if (Native && supported?.includes("ean_13")) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
          if (stopped) return;
          el.srcObject = stream;
          await el.play();
          setStatus("on");
          const detector = new Native({ formats: FORMATS.filter((f) => supported.includes(f)) });
          const tick = async () => {
            if (stopped) return;
            if (el.readyState >= 2) {
              const found = await detector.detect(el).catch(() => []);
              if (found[0]?.rawValue) seen(found[0].rawValue);
            }
            timer = setTimeout(tick, 150);
          };
          void tick();
        } else {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          if (stopped) return;
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, el, (result) => {
            if (result) seen(result.getText());
          });
          zxingStop = () => controls.stop();
          if (stopped) zxingStop();
          else setStatus("on");
        }
      } catch (e) {
        if (stopped) return;
        const name = (e as Error).name;
        setError(
          name === "NotAllowedError"
            ? "Camera permission was refused. Allow the camera for this site in your browser settings, or use a handheld scanner / type the code."
            : name === "NotFoundError"
              ? "No camera found on this device. Use a handheld scanner or type the code."
              : "The camera couldn't start. Close other apps using it and try again.",
        );
        setStatus("error");
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      zxingStop?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black">
      <video ref={video} className="aspect-[4/3] w-full object-cover" muted playsInline />
      {status === "on" && <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />}
      {status === "starting" && (
        <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" /> Starting camera…
        </p>
      )}
      {status === "error" && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-100">{error}</p>}
      <button type="button" onClick={onClose} className="absolute right-2 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
        Close camera
      </button>
    </div>
  );
}
