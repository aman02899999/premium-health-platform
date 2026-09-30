"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold">
      <Printer className="h-4 w-4" /> Print diet chart
    </button>
  );
}
