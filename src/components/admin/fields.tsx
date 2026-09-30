"use client";

/* eslint-disable @next/next/no-img-element -- previews of arbitrary admin image URLs */
import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { ICONS } from "@/components/Icon";

export type FieldType = "text" | "textarea" | "number" | "image" | "lines" | "bool" | "color" | "icon" | "date";
export type Field = { key: string; label: string; type?: FieldType; help?: string; wide?: boolean };

type Obj = Record<string, unknown>;

export function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange(json.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-white/30" />}
      </div>
      <div className="flex-1 space-y-2">
        <input className="field text-sm" value={value} placeholder="Paste image URL or upload →" onChange={(e) => onChange(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-black" disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Upload
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70">
              Remove
            </button>
          )}
          {err && <span className="text-xs text-red-300">{err}</span>}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type ?? "text") {
    case "textarea":
      return <textarea className="field text-sm" rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <input type="number" step="any" className="field text-sm" value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} />;
    case "image":
      return <ImageInput value={String(value ?? "")} onChange={onChange} />;
    case "lines":
      return (
        <textarea
          className="field text-sm"
          rows={4}
          value={((value as string[]) ?? []).join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n"))}
          onBlur={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
        />
      );
    case "bool":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#d4a94a]" /> Yes
        </label>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={String(value ?? "#000000")} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 rounded-lg bg-transparent" />
          <input className="field text-sm" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "icon":
      return (
        <select className="field text-sm" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {Object.keys(ICONS).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      );
    case "date":
      return <input type="date" className="field text-sm" value={String(value ?? "").slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input className="field text-sm" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function ObjectEditor<T extends Obj>({ value, fields, onChange }: { value: T; fields: Field[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={f.wide || f.type === "textarea" || f.type === "image" || f.type === "lines" ? "md:col-span-2" : ""}>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">{f.label}</label>
          <FieldInput field={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
          {f.help && <p className="mt-1 text-xs text-white/40">{f.help}</p>}
        </div>
      ))}
    </div>
  );
}

export function ListEditor<T extends Obj>({
  items,
  fields,
  onChange,
  create,
  titleKey,
  addLabel = "Add item",
}: {
  items: T[];
  fields: Field[];
  onChange: (v: T[]) => void;
  create: () => T;
  titleKey: string;
  addLabel?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl bg-white/[.03] ring-1 ring-white/10">
          <div className="flex items-center gap-2 px-4 py-3">
            <button type="button" className="flex-1 text-left font-semibold text-white" onClick={() => setOpen(open === i ? null : i)}>
              {String(item[titleKey] || "(untitled)")}
            </button>
            <button type="button" onClick={() => move(i, -1)} className="rounded p-1.5 text-white/50 hover:text-white" aria-label="Move up">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => move(i, 1)} className="rounded p-1.5 text-white/50 hover:text-white" aria-label="Move down">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${String(item[titleKey] || "item")}"?`)) onChange(items.filter((_, k) => k !== i));
              }}
              className="rounded p-1.5 text-red-300/70 hover:text-red-300"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {open === i && (
            <div className="border-t border-white/10 p-4">
              <ObjectEditor value={item} fields={fields} onChange={(v) => onChange(items.map((it, k) => (k === i ? v : it)))} />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onChange([...items, create()]);
          setOpen(items.length);
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gold/50 px-4 py-2.5 text-sm font-semibold text-gold hover:bg-gold/10"
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}
