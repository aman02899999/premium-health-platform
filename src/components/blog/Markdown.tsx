/* eslint-disable @next/next/no-img-element -- admin-authored post images can be on any host */
import Link from "next/link";
import type { ReactNode } from "react";
import type { Block, Inline } from "@/lib/markdown";
import { Calculator } from "@/components/tools/Calculator";
import { Quiz } from "./Quiz";
import { CtaCard } from "./CtaCard";

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "strong":
        return <strong key={i}>{renderInline(n.c)}</strong>;
      case "em":
        return <em key={i}>{renderInline(n.c)}</em>;
      case "code":
        return <code key={i}>{n.v}</code>;
      case "link":
        return n.href.startsWith("/") ? (
          <Link key={i} href={n.href}>
            {renderInline(n.c)}
          </Link>
        ) : (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer">
            {renderInline(n.c)}
          </a>
        );
    }
  });
}

export function Markdown({ blocks, cta }: { blocks: Block[]; cta: { whatsapp: string; phone: string } }) {
  return (
    <div className="prose-royal">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2":
            return (
              <h2 key={i} id={b.id} className="scroll-mt-28">
                {renderInline(b.c)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} id={b.id} className="scroll-mt-28">
                {renderInline(b.c)}
              </h3>
            );
          case "p":
            return <p key={i}>{renderInline(b.c)}</p>;
          case "ul":
          case "ol": {
            const L = b.t;
            return (
              <L key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </L>
            );
          }
          case "quote":
            return <blockquote key={i}>{renderInline(b.c)}</blockquote>;
          case "table":
            return (
              <div key={i} className="my-6 overflow-x-auto rounded-2xl ring-1 ring-white/10">
                <table>
                  <thead className="bg-black/30">
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j}>{renderInline(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>{renderInline(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "img":
            return (
              <figure key={i} className="my-8">
                <img src={b.src} alt={b.alt} loading="lazy" className="w-full rounded-2xl" />
                {b.alt && <figcaption className="mt-2 text-center text-sm text-white/50">{b.alt}</figcaption>}
              </figure>
            );
          case "hr":
            return <hr key={i} className="my-10 border-white/10" />;
          case "calculator":
            return <Calculator key={i} calcKey={b.key} embedded />;
          case "quiz":
            return <Quiz key={i} question={b.question} options={b.options} answer={b.answer} explanation={b.explanation} />;
          case "cta":
            return <CtaCard key={i} whatsapp={cta.whatsapp} phone={cta.phone} />;
        }
      })}
    </div>
  );
}
