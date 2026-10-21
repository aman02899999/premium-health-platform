"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * A Mermaid flowchart, drawn in the browser. mermaid (~500 KB) loads only when the chart is about
 * to scroll into view. The server-rendered text version (the chart's steps) stays in the page for
 * crawlers, screen readers and anyone with JavaScript off.
 */
export function Mermaid({ code, caption, steps, lang }: { code: string; caption: string; steps: string[]; lang: "en" | "hi" }) {
  const box = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    const draw = async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", fontFamily: "inherit", themeVariables: { primaryColor: "#ecfdf5", primaryBorderColor: "#047857", primaryTextColor: "#1c1917", lineColor: "#57534e", fontSize: "15px" } });
        const out = await mermaid.render(id, code);
        if (!cancelled) setSvg(out.svg);
      } catch {
        // Keep the text version.
      }
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        void draw();
      }
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [code, id]);

  return (
    <figure className="my-8 rounded-2xl border border-emerald-200 bg-white p-4 dark:border-emerald-900 dark:bg-stone-900">
      <div ref={box} className="flex min-h-[200px] justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full" {...(svg ? { dangerouslySetInnerHTML: { __html: svg } } : {})}>
        {svg ? null : (
          <ol className="list-decimal space-y-1 pl-6 text-sm text-stone-700 dark:text-stone-300">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
      </div>
      {caption && <figcaption className="mt-3 text-center text-sm font-medium text-stone-600 dark:text-stone-400">{caption}</figcaption>}
      {svg && (
        <details className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          <summary className="cursor-pointer">{lang === "hi" ? "इस फ़्लोचार्ट का टेक्स्ट रूप" : "Text version of this flowchart"}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </details>
      )}
    </figure>
  );
}
