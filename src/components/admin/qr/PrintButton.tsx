"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="ml-auto rounded-lg bg-[#111] px-4 py-2 font-semibold text-white">
      Print
    </button>
  );
}
