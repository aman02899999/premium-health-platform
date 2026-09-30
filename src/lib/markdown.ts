// Minimal markdown → block tree. Rendering to React happens in
// components/blog/Markdown.tsx, so no raw HTML ever reaches the page.

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] };

export type Block =
  | { t: "h2" | "h3"; id: string; text: string; c: Inline[] }
  | { t: "p"; c: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "quote"; c: Inline[] }
  | { t: "table"; head: Inline[][]; rows: Inline[][][] }
  | { t: "img"; src: string; alt: string }
  | { t: "hr" }
  | { t: "calculator"; key: string }
  | { t: "quiz"; question: string; options: string[]; answer: number; explanation: string }
  | { t: "cta" };

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^(https?:|mailto:|tel:)/i.test(h) || h.startsWith("/") || h.startsWith("#")) return h;
  return null;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) });
    if (m[1]) out.push({ t: "strong", c: parseInline(m[2]) });
    else if (m[3]) out.push({ t: "em", c: parseInline(m[4]) });
    else if (m[5]) out.push({ t: "code", v: m[6] });
    else if (m[7]) {
      const href = safeHref(m[9]);
      out.push(href ? { t: "link", href, c: parseInline(m[8]) } : { t: "text", v: m[8] });
    }
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const usedIds = new Map<string, number>();
  let i = 0;

  const uniqueId = (text: string) => {
    const base = headingId(text) || "section";
    const n = usedIds.get(base) ?? 0;
    usedIds.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }

    const short = trimmed.match(/^\[\[(\w[\w-]*)(?::(.*))?\]\]$/);
    if (short) {
      const [, name, arg = ""] = short;
      if (name === "calculator") blocks.push({ t: "calculator", key: arg.trim() });
      else if (name === "cta") blocks.push({ t: "cta" });
      else if (name === "quiz") {
        const parts = arg.split("|").map((s) => s.trim());
        const question = parts.shift() ?? "";
        const explanation = parts.length > 2 ? parts.pop()! : "";
        const answer = Math.max(0, parts.findIndex((p) => p.startsWith("*")));
        blocks.push({ t: "quiz", question, options: parts.map((p) => p.replace(/^\*/, "")), answer, explanation });
      }
      i++;
      continue;
    }

    const h = trimmed.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      const text = h[2].trim();
      blocks.push({ t: h[1].length === 2 ? "h2" : "h3", id: uniqueId(text), text, c: parseInline(text) });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }

    const img = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      const src = safeHref(img[2]);
      if (src) blocks.push({ t: "img", alt: img[1], src });
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) buf.push(lines[i++].trim().replace(/^>\s?/, ""));
      blocks.push({ t: "quote", c: parseInline(buf.join(" ")) });
      continue;
    }

    if (trimmed.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      const head = splitRow(trimmed).map(parseInline);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]).map(parseInline));
      blocks.push({ t: "table", head, rows });
      continue;
    }

    const listMatch = (l: string) => l.trim().match(/^([-*]|\d+\.)\s+(.*)$/);
    const first = listMatch(line);
    if (first) {
      const ordered = /\d/.test(first[1]);
      const items: Inline[][] = [];
      let lm: RegExpMatchArray | null;
      while (i < lines.length && (lm = listMatch(lines[i])) && /\d/.test(lm[1]) === ordered) {
        items.push(parseInline(lm[2]));
        i++;
      }
      blocks.push({ t: ordered ? "ol" : "ul", items });
      continue;
    }

    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{2,3}\s|>|\||[-*]\s|\d+\.\s|\[\[|!\[)/.test(lines[i].trim())
    ) {
      buf.push(lines[i++].trim());
    }
    if (buf.length) blocks.push({ t: "p", c: parseInline(buf.join(" ")) });
    else i++;
  }
  return blocks;
}

export function toc(blocks: Block[]) {
  return blocks.flatMap((b) => (b.t === "h2" || b.t === "h3" ? [{ id: b.id, text: b.text, level: b.t === "h2" ? 2 : 3 }] : []));
}

export function readingMinutes(src: string): number {
  // ~200 wpm, plus about a minute per interactive calculator.
  const words = src.replace(/\[\[[^\]]*\]\]/g, "").split(/\s+/).filter(Boolean).length;
  const tools = (src.match(/\[\[calculator:/g) ?? []).length;
  return Math.max(1, Math.ceil(words / 200) + tools);
}

export function plainText(src: string): string {
  return src
    .replace(/\[\[[^\]]*\]\]/g, "")
    .replace(/[#>*`|_-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
