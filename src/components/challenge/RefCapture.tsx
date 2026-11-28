"use client";

import { useEffect } from "react";

export const REF_KEY = "rfc-challenge-ref";

/** Remembers a friend's referral code from /challenge?ref=CODE until the profile is created. */
export function RefCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(location.search).get("ref")?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (!ref || ref.length < 6) return;
    try {
      localStorage.setItem(REF_KEY, ref);
    } catch {
      // Private mode: the code can still be typed in the form.
    }
  }, []);
  return null;
}
