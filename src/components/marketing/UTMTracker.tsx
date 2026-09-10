"use client";

import { useEffect, useState } from "react";

export function useUTM() {
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bhg-utm");
      if (raw) setUtm(JSON.parse(raw));
    } catch {}
  }, []);
  return utm;
}

export function UTMDisplay() {
  const utm = useUTM();
  if (!Object.keys(utm).length) return null;
  return (
    <div className="rounded-xl bg-stone-100 p-2 text-[11px] text-stone-600 dark:bg-stone-800">
      <p className="font-bold">Tracking: {utm.utm_source || utm.ref || "direct"} {utm.utm_campaign ? `· ${utm.utm_campaign}` : ""}</p>
    </div>
  );
}
