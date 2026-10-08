"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowLeft, ClipboardList, Cloud, CloudOff, CloudUpload, Database, Download, Dumbbell, FileJson, FlaskConical, HeartPulse, Loader2, Plus, Repeat2, Ruler, Save, Search, ShieldCheck, Trash2, Upload, User, Utensils, X } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ACTIVITY, DEFAULT_RATE, targets } from "@/lib/diet-pro/engine";
import { FOOD_DB } from "@/lib/diet-pro/foods";
import { lifestyle, supplements, training } from "@/lib/diet-pro/guidance";
import { deviation, foodTable, planDays } from "@/lib/diet-pro/meals";
import type { Allergen, ClientProfile, Cuisine, DietPref, FoodItem, Goal, Style } from "@/lib/diet-pro/types";
import { EXERCISES, MUSCLES, type Muscle } from "@/lib/fitness/exercises";
import { Body3D, filledMeasurements, type Body3DHandle, type BodyPick, type BodyView } from "./Body3D";
import { Check, Choice, Kpi, Num, Section, Select, Tilt } from "./ui";
import { downloadPlanPdf, type PdfBusiness } from "./pdf";
import { DietChart } from "./DietChart";
import { household } from "@/lib/diet-pro/household";

const GOALS: { value: Goal; label: string }[] = [
  { value: "fat-loss", label: "Fat loss" },
  { value: "recomp", label: "Recomp" },
  { value: "maintain", label: "Maintain" },
  { value: "lean-gain", label: "Lean gain" },
  { value: "gain", label: "Gain" },
];
const DIETS: { value: DietPref; label: string }[] = [
  { value: "veg", label: "Veg" },
  { value: "egg", label: "Eggetarian" },
  { value: "nonveg", label: "Non-veg" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain" },
];
const STYLES: { value: Style; label: string }[] = [
  { value: "balanced", label: "Balanced" },
  { value: "high-protein", label: "High protein" },
  { value: "low-carb", label: "Low carb" },
  { value: "keto", label: "Keto (<50 g carbs)" },
  { value: "diabetic", label: "Diabetes-friendly (low GI)" },
  { value: "pcos", label: "PCOS-friendly (low GI)" },
  { value: "heart", label: "Heart-healthy (low sat. fat)" },
  { value: "high-fibre", label: "High fibre (gut health)" },
  { value: "sattvic", label: "Sattvic (no onion / mushroom)" },
  { value: "vrat", label: "Vrat / fasting day" },
];
const CUISINES: { value: Cuisine; label: string }[] = [
  { value: "any", label: "All-India mix" },
  { value: "north", label: "North Indian (Punjabi, UP, Delhi)" },
  { value: "south", label: "South Indian (TN, Kerala, Karnataka, AP)" },
  { value: "west", label: "West Indian (Gujarati, Maharashtrian)" },
  { value: "east", label: "East Indian (Bengali, Odia)" },
];
const ALLERGENS: Allergen[] = ["dairy", "gluten", "nuts", "peanut", "soy", "egg", "fish", "shellfish", "sesame"];
const label = <T extends string>(list: { value: T; label: string }[], v: T) => list.find((x) => x.value === v)?.label ?? v;

const DEFAULT: ClientProfile = {
  name: "",
  age: 30,
  sex: "male",
  heightCm: 172,
  weightKg: 78,
  m: {},
  activity: "moderate",
  trainingDays: 4,
  level: "intermediate",
  setting: "gym",
  goal: "fat-loss",
  ratePct: 0.5,
  style: "balanced",
  diet: "veg",
  mealsPerDay: 5,
  allergies: [],
  conditions: { pcos: false, hypothyroid: false, diabetes: false, hypertension: false, ckd: false, pregnant: false, lactating: false },
  useWhey: false,
  // Example label only — the coach must replace it with the client's tub.
  whey: { scoopG: 30, kcal: 120, p: 24, c: 3, f: 1.5, edited: false },
  bmiScale: "asian",
  bmrFormula: "mifflin",
  overrides: {},
};

type LogEntry = { date: string; weight: number; waist?: number; bf?: number };
type SavedClient = { id: string; name: string; savedAt: string; profile: ClientProfile; swaps: Record<string, number>; extras: Record<string, { id: string; grams: number }[]>; note: string; log: LogEntry[]; consentAt?: string; consentBy?: string; local?: boolean };
type CloudClient = { id: string; name: string; profile: ClientProfile; swaps: SavedClient["swaps"]; extras: SavedClient["extras"]; note: string; log: LogEntry[]; consentAt: string; consentBy: string; updatedAt: string };
const fromCloud = (c: CloudClient): SavedClient => ({ ...c, savedAt: c.updatedAt });
type Mode = "loading" | "cloud" | "local";

const CLIENTS_KEY = "rfc-dietpro-clients-v1";
const FOODS_KEY = "rfc-dietpro-foods-v1";
const read = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full or blocked */
  }
};

type Tab = "analysis" | "chart" | "meals" | "training" | "guidance" | "foods" | "progress";

export default function DietPro({ business, coach }: { business: PdfBusiness; coach: string }) {
  const [p, setP] = useState<ClientProfile>(DEFAULT);
  const [swaps, setSwaps] = useState<Record<string, number>>({});
  const [extras, setExtras] = useState<Record<string, { id: string; grams: number }[]>>({});
  const [note, setNote] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [consentAt, setConsentAt] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("loading");
  const [cloudClients, setCloudClients] = useState<SavedClient[]>([]);
  const [localClients, setLocalClients] = useState<SavedClient[]>(() => read<SavedClient[]>(CLIENTS_KEY, []).map((c) => ({ ...c, local: true })));
  const [cloudFoods, setCloudFoods] = useState<FoodItem[]>([]);
  const [localFoods, setLocalFoods] = useState<FoodItem[]>(() => read(FOODS_KEY, []));
  const clients = mode === "cloud" ? [...cloudClients, ...localClients] : localClients;
  const customFoods = useMemo(() => {
    const m = new Map<string, FoodItem>();
    for (const f of [...localFoods, ...cloudFoods]) m.set(f.id, f);
    return [...m.values()];
  }, [localFoods, cloudFoods]);
  const [tab, setTab] = useState<Tab>("analysis");
  const [day, setDay] = useState(0);
  const [view, setView] = useState<BodyView>("muscles");
  const [rings, setRings] = useState(true);
  const [muscle, setMuscle] = useState<BodyPick>(null);
  const [trainDay, setTrainDay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const body = useRef<Body3DHandle>(null);

  // Load the shared, admin-only cloud records; fall back to this browser if unavailable.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [c, f] = await Promise.all([fetch("/api/admin/diet-pro/clients"), fetch("/api/admin/diet-pro/foods")]);
        if (!c.ok || !f.ok) throw new Error(String(c.status));
        const cj = (await c.json()) as { clients: CloudClient[] };
        const fj = (await f.json()) as { foods: FoodItem[] };
        if (!alive) return;
        setCloudClients(cj.clients.map(fromCloud));
        setCloudFoods(fj.foods);
        setMode("cloud");
      } catch {
        if (alive) setMode("local");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const set = (patch: Partial<ClientProfile>) => setP((x) => ({ ...x, ...patch }));
  const T = useMemo(() => targets(p), [p]);
  const days = useMemo(() => planDays(T, p, 7, swaps, customFoods, extras), [T, p, swaps, customFoods, extras]);
  const train = useMemo(() => training(p), [p]);
  const supps = useMemo(() => supplements(p), [p]);
  const habits = useMemo(() => lifestyle(p), [p]);
  const foods = useMemo(() => foodTable(p, customFoods), [p, customFoods]);
  const A = T.analysis;
  const filled = filledMeasurements(p.sex, p.heightCm, p.weightKg, p.m);
  const highlight = train[trainDay]?.muscles ?? [];
  const toast = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(null), 2600);
  };

  const labels = {
    goal: `${label(GOALS, p.goal)}${T.rate ? ` · ${T.rate} %/week` : ""}`,
    diet: label(DIETS, p.diet),
    style: label(STYLES, p.style),
    activity: ACTIVITY.find((a) => a.id === p.activity)?.label ?? p.activity,
  };

  async function pdf() {
    if (p.useWhey && !p.whey.edited && !confirm("Whey is still using the example label values. Download anyway?")) return;
    setBusy(true);
    try {
      const img = body.current?.snapshot() ?? null;
      await downloadPlanPdf({ client: p, t: T, days, training: train, supplements: supps, lifestyle: habits, business, coach, coachNote: note, bodyImage: img, labels });
    } catch (e) {
      console.error(e);
      toast("PDF failed — see console");
    } finally {
      setBusy(false);
    }
  }

  async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
    const json = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
    return json;
  }

  function saveLocal(next: SavedClient[]) {
    setLocalClients(next);
    write(CLIENTS_KEY, next.map(({ local: _l, ...c }) => c));
  }

  async function saveClient() {
    if (!p.name.trim()) return toast("Add the client's name first");
    if (mode === "cloud") {
      if (!consentAt) return toast("Tick the client's consent first");
      setBusy(true);
      try {
        const isCloudId = cloudClients.some((c) => c.id === clientId);
        const { client } = await api<{ client: CloudClient }>("/api/admin/diet-pro/clients", {
          method: "POST",
          body: JSON.stringify({ id: isCloudId ? clientId : undefined, name: p.name.trim(), profile: p, swaps, extras, note, log, consentAt, consentBy: coach }),
        });
        const rec = fromCloud(client);
        setCloudClients((list) => [rec, ...list.filter((c) => c.id !== rec.id)]);
        // A client that was only on this device now lives in the cloud.
        if (clientId && !isCloudId) saveLocal(localClients.filter((c) => c.id !== clientId));
        setClientId(rec.id);
        toast(`Saved ${rec.name} to the cloud`);
      } catch (e) {
        toast((e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }
    const id = clientId ?? `c${Date.now().toString(36)}`;
    const rec: SavedClient = { id, name: p.name.trim(), savedAt: new Date().toISOString(), profile: p, swaps, extras, note, log, consentAt: consentAt ?? undefined, local: true };
    saveLocal([rec, ...localClients.filter((c) => c.id !== id)]);
    setClientId(id);
    toast(`Saved ${rec.name} on this device`);
  }
  function loadClient(c: SavedClient) {
    setP({ ...DEFAULT, ...c.profile, conditions: { ...DEFAULT.conditions, ...c.profile.conditions }, overrides: c.profile.overrides ?? {} });
    setSwaps(c.swaps ?? {});
    setExtras(c.extras ?? {});
    setNote(c.note ?? "");
    setLog(c.log ?? []);
    setClientId(c.id);
    setConsentAt(c.consentAt ?? null);
    setDay(0);
  }
  async function deleteClient(c: SavedClient) {
    if (!confirm(`Permanently delete ${c.name}${c.local ? " from this device" : " and all their data"}?`)) return;
    if (c.local) saveLocal(localClients.filter((x) => x.id !== c.id));
    else {
      try {
        await api(`/api/admin/diet-pro/clients?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
        setCloudClients((list) => list.filter((x) => x.id !== c.id));
      } catch (e) {
        return toast((e as Error).message);
      }
    }
    if (clientId === c.id) setClientId(null);
  }
  function newClient() {
    setP(DEFAULT);
    setSwaps({});
    setExtras({});
    setNote("");
    setLog([]);
    setClientId(null);
    setConsentAt(null);
  }
  /** Move clients and foods that only exist in this browser into the cloud. */
  async function moveToCloud() {
    if (!localClients.length && !localFoods.length) return;
    if (localClients.length && !confirm(`Upload ${localClients.length} client(s) from this device? Only continue if each of them agreed to the gym storing their health data.`)) return;
    setBusy(true);
    let moved = 0;
    const left: SavedClient[] = [];
    for (const c of localClients) {
      try {
        const { client } = await api<{ client: CloudClient }>("/api/admin/diet-pro/clients", {
          method: "POST",
          body: JSON.stringify({ name: c.name, profile: c.profile, swaps: c.swaps, extras: c.extras, note: c.note, log: c.log, consentAt: c.consentAt ?? new Date().toISOString(), consentBy: c.consentAt ? coach : `${coach} (confirmed when moving to cloud)` }),
        });
        setCloudClients((list) => [fromCloud(client), ...list]);
        if (clientId === c.id) setClientId(client.id);
        moved++;
      } catch {
        left.push(c);
      }
    }
    saveLocal(left);
    const keptFoods: FoodItem[] = [];
    for (const f of localFoods) {
      try {
        await api("/api/admin/diet-pro/foods", { method: "POST", body: JSON.stringify(f) });
        setCloudFoods((list) => [f, ...list.filter((x) => x.id !== f.id)]);
      } catch {
        keptFoods.push(f);
      }
    }
    setLocalFoods(keptFoods);
    write(FOODS_KEY, keptFoods);
    setBusy(false);
    toast(left.length || keptFoods.length ? `Moved ${moved}; ${left.length + keptFoods.length} failed — try again` : `Moved ${moved} client(s) to the cloud`);
  }
  async function setFoods(next: FoodItem[]) {
    if (mode !== "cloud") {
      setLocalFoods(next);
      write(FOODS_KEY, next);
      return;
    }
    const added = next.filter((f) => !customFoods.some((x) => x.id === f.id));
    const removed = customFoods.filter((f) => !next.some((x) => x.id === f.id));
    try {
      for (const f of added) await api("/api/admin/diet-pro/foods", { method: "POST", body: JSON.stringify(f) });
      for (const f of removed) {
        if (cloudFoods.some((x) => x.id === f.id)) await api(`/api/admin/diet-pro/foods?id=${encodeURIComponent(f.id)}`, { method: "DELETE" });
      }
      setCloudFoods((list) => [...added, ...list.filter((x) => !removed.some((r) => r.id === x.id))]);
      if (removed.some((r) => localFoods.some((x) => x.id === r.id))) {
        const lf = localFoods.filter((x) => !removed.some((r) => r.id === x.id));
        setLocalFoods(lf);
        write(FOODS_KEY, lf);
      }
    } catch (e) {
      toast((e as Error).message);
    }
  }
  function exportAll() {
    const blob = new Blob([JSON.stringify({ clients: clients.map(({ local: _l, ...c }) => c), foods: customFoods }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `diet-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importAll(file: File) {
    try {
      const data = JSON.parse(await file.text()) as { clients?: SavedClient[]; foods?: FoodItem[] };
      // Imports land on this device first; "Move to cloud" uploads them after a consent check.
      const known = new Set(clients.map((c) => c.id));
      const incoming = (data.clients ?? []).filter((c) => c?.id && c.profile && !known.has(c.id)).map((c) => ({ ...c, local: true }));
      saveLocal([...incoming, ...localClients]);
      const fById = new Map(localFoods.map((f) => [f.id, f]));
      for (const f of data.foods ?? []) if (f?.id?.startsWith("usda-") && !cloudFoods.some((x) => x.id === f.id)) fById.set(f.id, f);
      const nextFoods = [...fById.values()];
      setLocalFoods(nextFoods);
      write(FOODS_KEY, nextFoods);
      toast(`Imported ${incoming.length} client(s) to this device`);
    } catch {
      toast("That file is not a Diet Pro backup");
    }
  }

  const k = (d: number, mi: number) => `${d}-${mi}`;
  const meal = days[day];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink text-white">
      {/* 3D atmosphere */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand/25 blur-[140px]" />
        <div className="absolute -right-40 top-1/3 h-[560px] w-[560px] rounded-full bg-navy/60 blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] [transform:perspective(900px)_rotateX(55deg)_translateY(30%)]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3">
          <a href="/admin" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-2 text-xs text-white/75 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Admin
          </a>
          <div className="mr-auto flex items-center gap-2">
            <span className="font-display text-lg">Diet Pro</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-soft ring-1 ring-brand/40">
              <ShieldCheck className="h-3 w-3" /> Admin only
            </span>
          </div>
          {flash && <span className="text-xs text-emerald-300">{flash}</span>}
          <span className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 sm:inline-flex ${mode === "cloud" ? "text-emerald-200 ring-emerald-400/40" : mode === "local" ? "text-amber-200 ring-amber-300/40" : "text-white/50 ring-white/15"}`}>
            {mode === "cloud" ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />} {mode === "cloud" ? "Cloud" : mode === "local" ? "This browser" : "…"}
          </span>
          <button type="button" onClick={newClient} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 hover:text-white">
            New client
          </button>
          <button type="button" onClick={saveClient} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/85 hover:text-white">
            <Save className="h-4 w-4" /> Save
          </button>
          <button type="button" onClick={pdf} disabled={busy} className="btn-brand inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold shadow-[0_10px_30px_-10px_rgba(232,57,75,0.9)] disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Branded PDF
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1500px] gap-5 px-4 py-5 xl:grid-cols-[380px_1fr]">
        {/* ───────────── Inputs ───────────── */}
        <aside className="grid content-start gap-3">
          <Section title="Client" icon={<User className="h-4 w-4 text-brand" />}>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">Name</span>
              <input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Client name (shown on the PDF)" className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-sky" />
            </label>
            <Choice label="Sex" value={p.sex} onChange={(sex) => set({ sex, conditions: { ...p.conditions, pcos: sex === "male" ? false : p.conditions.pcos, pregnant: sex === "male" ? false : p.conditions.pregnant, lactating: sex === "male" ? false : p.conditions.lactating } })} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
            <div className="grid grid-cols-3 gap-2">
              <Num label="Age" unit="yr" value={p.age} min={18} max={90} onChange={(v) => v && set({ age: v })} />
              <Num label="Height" unit="cm" value={p.heightCm} min={120} max={230} step={0.5} onChange={(v) => v && set({ heightCm: v })} />
              <Num label="Weight" unit="kg" value={p.weightKg} min={30} max={250} step={0.1} onChange={(v) => v && set({ weightKg: v })} />
            </div>
            <Num label="Target weight" unit="kg (optional)" value={p.targetWeightKg} optional min={30} max={250} step={0.5} onChange={(v) => set({ targetWeightKg: v })} />
            <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-[11px] leading-snug ${consentAt ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-amber-300/40 bg-amber-400/10 text-amber-100"}`}>
              <input type="checkbox" className="mt-0.5 accent-[#e8394b]" checked={!!consentAt} onChange={(e) => setConsentAt(e.target.checked ? new Date().toISOString() : null)} />
              <span>
                Client agreed that {business.name} may store their body measurements and health details to prepare their plan, and knows they can ask for deletion at any time.
                {consentAt && <span className="block text-[10px] opacity-70">Recorded {new Date(consentAt).toLocaleString("en-IN")}</span>}
              </span>
            </label>
          </Section>

          <Section title="Tape measurements" icon={<Ruler className="h-4 w-4 text-brand" />}>
            <p className="text-[11px] text-white/45">Measure relaxed, tape level, in cm. Neck + waist{p.sex === "female" ? " + hip" : ""} enable the US Navy body-fat method. Empty fields are estimated for the 3D model only.</p>
            <div className="grid grid-cols-3 gap-2">
              {(["neck", "chest", "waist", "hip", "arm", "forearm", "thigh", "calf", "wrist"] as const).map((key) => (
                <Num key={key} label={key} unit="cm" optional value={p.m[key]} min={10} max={250} step={0.5} onChange={(v) => set({ m: { ...p.m, [key]: v } })} />
              ))}
            </div>
            <Num label="Measured body fat" unit="% (DEXA/BIA/calliper)" optional value={p.measuredBodyFat} min={3} max={65} step={0.1} onChange={(v) => set({ measuredBodyFat: v })} />
          </Section>

          <Section title="Goal & activity" icon={<Activity className="h-4 w-4 text-brand" />}>
            <Choice label="Goal" value={p.goal} onChange={(goal) => set({ goal, ratePct: DEFAULT_RATE[goal] })} options={GOALS} />
            {p.goal !== "maintain" && (
              <Num label="Rate" unit="% body weight / week" value={p.ratePct} min={0.1} max={1} step={0.05} hint={`≈ ${((p.ratePct * p.weightKg) / 100).toFixed(2)} kg per week`} onChange={(v) => v && set({ ratePct: v })} />
            )}
            <Select label="Daily activity" value={p.activity} onChange={(activity) => set({ activity })} options={ACTIVITY.map((a) => ({ value: a.id, label: `${a.label} (×${a.factor})` }))} />
            <div className="grid grid-cols-2 gap-2">
              <Num label="Training days" unit="/week" value={p.trainingDays} min={0} max={6} onChange={(v) => v !== undefined && set({ trainingDays: v })} />
              <Select label="Level" value={p.level} onChange={(level) => set({ level })} options={[{ value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }]} />
            </div>
            <Choice label="Trains at" value={p.setting} onChange={(setting) => set({ setting })} options={[{ value: "gym", label: "Gym" }, { value: "home", label: "Home" }]} />
          </Section>

          <Section title="Diet" icon={<Utensils className="h-4 w-4 text-brand" />}>
            <Choice label="Food preference" value={p.diet} onChange={(diet) => set({ diet })} options={DIETS} />
            <Select label="Diet style" value={p.style} onChange={(style) => set({ style })} options={STYLES} />
            <Select label="Cuisine" value={p.cuisine ?? "any"} onChange={(cuisine) => set({ cuisine })} options={CUISINES} />
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">Wakes up at</span>
                <input type="time" value={p.wakeTime ?? "06:30"} onChange={(e) => set({ wakeTime: e.target.value || undefined })} className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-sky" />
              </label>
              <div className="flex items-end">
                <Check label="Budget foods only" checked={!!p.budget} onChange={(budget) => set({ budget })} />
              </div>
            </div>
            <Choice label="Meals per day" value={p.mealsPerDay} onChange={(mealsPerDay) => set({ mealsPerDay })} options={[3, 4, 5, 6].map((n) => ({ value: n as 3 | 4 | 5 | 6, label: String(n) }))} />
            <div>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">Allergies / avoid</span>
              <div className="flex flex-wrap gap-1.5">
                {ALLERGENS.map((a) => (
                  <Check key={a} label={a} checked={p.allergies.includes(a)} onChange={(on) => set({ allergies: on ? [...p.allergies, a] : p.allergies.filter((x) => x !== a) })} />
                ))}
              </div>
            </div>
            <Check label="Include whey protein" checked={p.useWhey} onChange={(useWhey) => set({ useWhey })} />
            {p.useWhey && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className={`mb-2 text-[11px] ${p.whey.edited ? "text-white/50" : "text-amber-300"}`}>{p.whey.edited ? "Per scoop, from the client's label." : "Example values — enter the client's tub label (per scoop)."}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["scoopG", "kcal", "p", "c", "f"] as const).map((key) => (
                    <Num key={key} label={key === "scoopG" ? "Scoop g" : key === "p" ? "Prot" : key === "c" ? "Carb" : key === "f" ? "Fat" : "kcal"} value={p.whey[key]} min={0} max={key === "kcal" ? 600 : 150} step={0.1} onChange={(v) => v !== undefined && set({ whey: { ...p.whey, [key]: v, edited: true } })} />
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Health conditions" icon={<HeartPulse className="h-4 w-4 text-brand" />} defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["diabetes", "Diabetes / prediabetes"],
                  ["hypertension", "High BP"],
                  ["hypothyroid", "Hypothyroid"],
                  ["ckd", "Kidney disease"],
                  ...(p.sex === "female" ? ([["pcos", "PCOS / PCOD"], ["pregnant", "Pregnant"], ["lactating", "Breastfeeding"]] as const) : []),
                ] as const
              ).map(([key, l]) => (
                <Check key={key} label={l} checked={p.conditions[key]} onChange={(on) => set({ conditions: { ...p.conditions, [key]: on } })} />
              ))}
            </div>
          </Section>

          <Section title="Advanced" icon={<FlaskConical className="h-4 w-4 text-brand" />} defaultOpen={false}>
            <Choice label="BMI cut-offs" value={p.bmiScale} onChange={(bmiScale) => set({ bmiScale })} options={[{ value: "asian", label: "Asian-Indian" }, { value: "who", label: "WHO" }]} />
            <Choice label="BMR formula" value={p.bmrFormula} onChange={(bmrFormula) => set({ bmrFormula })} options={[{ value: "mifflin", label: "Mifflin-St Jeor" }, { value: "katch", label: "Katch-McArdle" }]} />
            <p className="text-[11px] text-white/45">Katch-McArdle uses lean mass — choose it only with a measured or Navy body fat.</p>
            <div className="grid grid-cols-3 gap-2">
              <Num label="Calories" unit="kcal" optional value={p.overrides.calories} min={800} max={6000} onChange={(v) => set({ overrides: { ...p.overrides, calories: v } })} />
              <Num label="Protein" unit="g/kg" optional value={p.overrides.proteinGPerKg} min={0.6} max={3} step={0.1} onChange={(v) => set({ overrides: { ...p.overrides, proteinGPerKg: v } })} />
              <Num label="Fat" unit="% kcal" optional value={p.overrides.fatPct} min={15} max={75} onChange={(v) => set({ overrides: { ...p.overrides, fatPct: v } })} />
            </div>
          </Section>

          <Section title={`Saved clients (${clients.length})`} icon={<Database className="h-4 w-4 text-brand" />} defaultOpen={false}>
            <p className="text-[11px] text-white/45">
              {mode === "cloud"
                ? "Saved to the gym's secure database — only admins can see them, from any device. Deleting a client removes all their data."
                : mode === "loading"
                  ? "Connecting to the cloud…"
                  : "Cloud unavailable — clients are kept in this browser only. Export a backup."}
            </p>
            {mode === "cloud" && (localClients.length > 0 || localFoods.length > 0) && (
              <button type="button" onClick={moveToCloud} disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand/20 py-2 text-xs font-bold text-white ring-1 ring-brand/50 disabled:opacity-50">
                <CloudUpload className="h-3.5 w-3.5" /> Move {localClients.length} client(s){localFoods.length ? ` + ${localFoods.length} food(s)` : ""} from this device to the cloud
              </button>
            )}
            <ul className="grid max-h-56 gap-1 overflow-auto">
              {clients.map((c) => (
                <li key={c.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${clientId === c.id ? "bg-brand/20" : "bg-black/20"}`}>
                  <button type="button" onClick={() => loadClient(c)} className="flex-1 text-left">
                    <span className="font-semibold text-white">{c.name}</span>
                    {c.local && mode === "cloud" && <span className="ml-1.5 rounded bg-amber-400/20 px-1 text-[9px] font-bold uppercase text-amber-200">this device</span>}
                    <span className="block text-[10px] text-white/40">{new Date(c.savedAt).toLocaleString("en-IN")}</span>
                  </button>
                  <button type="button" onClick={() => deleteClient(c)} aria-label={`Delete ${c.name}`} className="text-white/40 hover:text-rose-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {!clients.length && <li className="text-xs text-white/40">No saved clients yet.</li>}
            </ul>
            <div className="flex gap-2">
              <button type="button" onClick={exportAll} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/15 py-2 text-xs text-white/75">
                <FileJson className="h-3.5 w-3.5" /> Export
              </button>
              <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-white/15 py-2 text-xs text-white/75">
                <Upload className="h-3.5 w-3.5" /> Import
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importAll(e.target.files[0])} />
              </label>
            </div>
          </Section>
        </aside>

        {/* ───────────── Results ───────────── */}
        <section className="grid min-w-0 content-start gap-5">
          {T.warnings.length > 0 && (
            <div className="grid gap-1.5">
              {T.warnings.map((w, i) => (
                <p key={i} className={`rounded-xl px-3 py-2 text-xs ring-1 ${w.tone === "alert" ? "bg-rose-500/15 text-rose-100 ring-rose-400/40" : "bg-amber-400/10 text-amber-100 ring-amber-300/30"}`}>
                  {w.text}
                </p>
              ))}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <Tilt className="relative overflow-hidden p-0" strength={2}>
              <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 p-3">
                <Choice label="" value={view} onChange={setView} options={[{ value: "muscles", label: "Muscles" }, { value: "xray", label: "X-ray" }, { value: "skeleton", label: "Skeleton" }, { value: "skin", label: "Body" }]} />
                <button type="button" onClick={() => setRings((r) => !r)} className={`h-8 self-end rounded-lg px-2.5 text-xs font-bold ring-1 ${rings ? "bg-brand/20 text-white ring-brand/50" : "text-white/50 ring-white/15"}`}>
                  Tape rings
                </button>
              </div>
              <div className="h-[520px] bg-[radial-gradient(ellipse_at_50%_35%,rgba(124,192,238,0.16),transparent_60%)]">
                <Body3D ref={body} sex={p.sex} heightCm={p.heightCm} weightKg={p.weightKg} bodyFat={A.bodyFat} m={filled.values} highlight={highlight} selected={muscle} view={view} rings={rings} onSelect={setMuscle} />
              </div>
              <div className="border-t border-white/10 p-3 text-xs">
                {muscle ? (
                  <div>
                    <p className="font-bold text-sky">
                      {muscle.label}
                      {muscle.side && <span className="font-normal text-white/50"> · {muscle.side}</span>}
                      <button type="button" onClick={() => setMuscle(null)} className="ml-2 text-white/40 hover:text-white" aria-label="Clear selection">
                        ×
                      </button>
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Group: {MUSCLES.find((x) => x.id === muscle.group)?.label ?? muscle.group}</p>
                    {MUSCLES.some((x) => x.id === muscle.group) && (
                      <p className="mt-1 text-white/60">
                        Train it with:{" "}
                        {EXERCISES.filter((e) => e.primary === (muscle.group as Muscle))
                          .slice(0, 5)
                          .map((e) => e.name)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/45">
                    Drag to rotate · scroll to zoom · right-drag to move · click a muscle · bright red = trained on{" "}
                    {train.length ? (
                      <select value={trainDay} onChange={(e) => setTrainDay(Number(e.target.value))} className="rounded bg-black/40 px-1 text-white">
                        {train.map((d, i) => (
                          <option key={i} value={i} className="bg-coal">
                            {d.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "no training days set"
                    )}
                    {filled.estimated.length > 0 && <span className="block text-[10px] text-white/35">Estimated for the model (not measured): {filled.estimated.join(", ")}</span>}
                  </p>
                )}
              </div>
            </Tilt>

            <div className="grid content-start gap-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Kpi label="Calories" value={T.kcal.toLocaleString("en-IN")} sub={<span className="text-white/60">{T.delta === 0 ? "maintenance" : `${T.delta > 0 ? "+" : ""}${T.delta} vs TDEE`}</span>} tone="alert" />
                <Kpi label="Protein" value={`${T.protein} g`} sub={<span className="text-white/60">{T.proteinPerKg} g/kg · ref {T.refKg} kg</span>} />
                <Kpi label="Carbs · Fat" value={`${T.carb} · ${T.fat}`} sub={<span className="text-white/60">grams / day</span>} />
                <Kpi label="BMI" value={A.bmi} sub={A.bmiBand.label} tone={A.bmiBand.tone} />
                <Kpi label="Body fat" value={`${A.bodyFat}%`} sub={`${A.bfBand.label} · ${A.bfMethod === "navy" ? "Navy" : A.bfMethod === "measured" ? "measured" : "estimate"}`} tone={A.bfBand.tone} />
                <Kpi label="Lean mass" value={`${A.leanKg} kg`} sub={<span className="text-white/60">FFMI {A.ffmi} (norm. {A.ffmiNorm})</span>} />
                <Kpi label="BMR" value={T.bmr} sub={<span className="text-white/60">{T.bmrFormula}</span>} />
                <Kpi label="TDEE" value={T.tdee} sub={<span className="text-white/60">× {T.factor}</span>} />
                <Kpi label="Per week" value={`${T.weeklyKg > 0 ? "+" : ""}${T.weeklyKg} kg`} sub={<span className="text-white/60">{T.weeksToGoal ? `goal in ~${T.weeksToGoal} wk` : "planned change"}</span>} />
              </div>
              <Tilt className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Waist risk</p>
                <div className="mt-2 grid gap-1.5 text-xs">
                  {A.whtr ? (
                    <>
                      <Row k="Waist ÷ height" v={A.whtr} band={A.whtrBand!} />
                      {A.whr && <Row k="Waist ÷ hip" v={A.whr} band={A.whrBand!} />}
                      <Row k="Waist" v={`${p.m.waist} cm`} band={A.waistBand!} />
                    </>
                  ) : (
                    <p className="text-white/45">Add a waist measurement to see abdominal-risk markers.</p>
                  )}
                  <p className="mt-1 text-white/45">
                    Healthy weight for height: <b className="text-white">{A.healthyRange.min}–{A.healthyRange.max} kg</b> ({p.bmiScale === "asian" ? "Asian" : "WHO"} BMI)
                  </p>
                </div>
              </Tilt>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex flex-wrap gap-1 rounded-2xl bg-black/30 p-1 ring-1 ring-white/10" role="tablist">
            {(
              [
                ["analysis", "Targets", FlaskConical],
                ["chart", "Diet chart", ClipboardList],
                ["meals", "Meal builder", Utensils],
                ["training", "Training", Dumbbell],
                ["guidance", "Guidance", HeartPulse],
                ["foods", "Food data", Database],
                ["progress", "Progress", Activity],
              ] as const
            ).map(([id, l, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${tab === id ? "bg-white/10 text-white shadow-inner" : "text-white/50 hover:text-white"}`}>
                <Icon className="h-3.5 w-3.5" /> {l}
              </button>
            ))}
          </nav>

          {tab === "analysis" && (
            <Tilt className="p-5" strength={1.5}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <h3 className="font-display text-lg">How the target was built</h3>
                  <ol className="mt-3 grid gap-2 text-sm text-white/75">
                    <li>
                      1. Resting energy ({T.bmrFormula}): <b className="text-white">{T.bmr} kcal</b>
                      {p.bmrFormula === "mifflin" && <span className="text-white/45"> (Katch-McArdle would give {T.bmrKatch})</span>}
                    </li>
                    <li>
                      2. × activity {T.factor} = maintenance <b className="text-white">{T.tdee} kcal</b>
                    </li>
                    <li>
                      3. {T.goal === "maintain" ? "No change" : `${T.rate} %/week × ${p.weightKg} kg × 7,700 kcal/kg ÷ 7`} → <b className="text-white">{T.delta > 0 ? "+" : ""}{T.delta} kcal/day</b>
                    </li>
                    <li>
                      4. Target <b className="text-white">{T.kcal} kcal</b> (floor {T.floor})
                    </li>
                    <li>
                      5. Protein {T.proteinPerKg} g/kg × {T.refKg} kg = <b className="text-white">{T.protein} g</b>; fat <b className="text-white">{T.fat} g</b>; carbs fill the rest = <b className="text-white">{T.carb} g</b>
                    </li>
                  </ol>
                </div>
                <div className="grid content-start gap-2 text-sm">
                  <h3 className="font-display text-lg">Daily nutrient targets</h3>
                  {[
                    ["Fibre", `${T.fibre} g`, "14 g per 1,000 kcal"],
                    ["Water (drinks)", `${T.waterRestL} L rest · ${T.waterTrainL} L training days`, "EFSA 2010"],
                    ["Calcium", `${T.calciumMg} mg`, "ICMR-NIN 2020 RDA"],
                    ["Iron", `${T.ironMg} mg`, "ICMR-NIN 2020 RDA"],
                    ["Potassium", `≥ ${T.potassiumMinMg} mg`, "WHO 2012"],
                    ["Sodium", `< ${T.sodiumMaxMg} mg (≈5 g salt)`, "WHO 2012"],
                  ].map(([a, b, c]) => (
                    <div key={a} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1.5">
                      <span className="text-white/60">{a}</span>
                      <span className="text-right">
                        <b>{b}</b>
                        <span className="block text-[10px] text-white/35">{c}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <label className="mt-5 block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">Coach&apos;s note for the PDF</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Focus this month: 8k steps daily, protein at every meal, no sugary drinks." className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-sky" />
              </label>
            </Tilt>
          )}

          {tab === "chart" && <DietChart days={days} day={day} setDay={setDay} p={p} />}

          {tab === "meals" && meal && (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {days.map((d, i) => {
                  const dv = deviation(d, T);
                  return (
                    <button key={i} type="button" onClick={() => setDay(i)} className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 transition ${day === i ? "bg-brand text-white ring-brand" : "bg-white/5 text-white/60 ring-white/10 hover:text-white"}`}>
                      Day {d.day}
                      <span className={`ml-1.5 text-[10px] ${Math.abs(dv.kcal) <= 5 ? "text-emerald-300" : "text-amber-300"} ${day === i ? "!text-white/80" : ""}`}>{dv.kcal > 0 ? "+" : ""}{dv.kcal}%</span>
                    </button>
                  );
                })}
              </div>
              <DaySummary d={meal} T={T} />
              {meal.meals.map((m, mi) => (
                <Tilt key={mi} className="p-4" strength={1.2}>
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="mr-auto">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-soft">
                        {m.label} · {m.pct}% of day
                      </p>
                      <h4 className="font-display text-lg leading-tight">{m.template}</h4>
                    </div>
                    <button type="button" onClick={() => setSwaps((s) => ({ ...s, [k(day, mi)]: (m.choice + 1) % m.options }))} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/75 hover:text-white" title="Swap to the next dish for this slot">
                      <Repeat2 className="h-3.5 w-3.5" /> Swap ({m.choice + 1}/{m.options})
                    </button>
                    <AddFood foods={foods} p={p} onAdd={(id, grams) => setExtras((e) => ({ ...e, [k(day, mi)]: [...(e[k(day, mi)] ?? []), { id, grams }] }))} />
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-xs">
                      <thead className="text-left text-[10px] uppercase tracking-wider text-white/40">
                        <tr>
                          <th className="py-1 font-semibold">Food</th>
                          <th className="font-semibold">Amount</th>
                          <th className="text-right font-semibold">kcal</th>
                          <th className="text-right font-semibold">P</th>
                          <th className="text-right font-semibold">C</th>
                          <th className="text-right font-semibold">F</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {m.items.map((it, ii) => {
                          const extraIdx = (extras[k(day, mi)] ?? []).findIndex((x) => x.id === it.food.id && x.grams === it.grams);
                          return (
                            <tr key={ii} className="border-t border-white/5">
                              <td className="py-1.5 pr-2">
                                {it.food.name}
                                <span className="ml-1 text-[9px] text-white/30" title={it.food.source.desc}>
                                  {it.food.source.db}
                                  {it.food.source.db !== "LABEL" ? ` ${it.food.source.ref}` : ""}
                                </span>
                              </td>
                              <td className="text-white/80">
                                {it.label}
                                <span className="block text-[10px] text-sky/80">{household(it.food.id, it.grams, m.template, p.useWhey ? p.whey : undefined).qty}</span>
                              </td>
                              <td className="text-right tabular-nums">{Math.round(it.macro.kcal)}</td>
                              <td className="text-right tabular-nums">{it.macro.p.toFixed(1)}</td>
                              <td className="text-right tabular-nums">{it.macro.c.toFixed(1)}</td>
                              <td className="text-right tabular-nums">{it.macro.f.toFixed(1)}</td>
                              <td className="pl-2 text-right">
                                {extraIdx >= 0 && (
                                  <button type="button" aria-label="Remove added food" onClick={() => setExtras((e) => ({ ...e, [k(day, mi)]: (e[k(day, mi)] ?? []).filter((_, n) => n !== extraIdx) }))} className="text-white/40 hover:text-rose-300">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-white/15 font-bold">
                          <td className="py-1.5">Meal total</td>
                          <td className="text-[10px] font-normal text-white/40">
                            target {Math.round(m.target.p)}P / {Math.round(m.target.c)}C / {Math.round(m.target.f)}F
                          </td>
                          <td className="text-right tabular-nums">{Math.round(m.total.kcal)}</td>
                          <td className="text-right tabular-nums">{m.total.p.toFixed(0)}</td>
                          <td className="text-right tabular-nums">{m.total.c.toFixed(0)}</td>
                          <td className="text-right tabular-nums">{m.total.f.toFixed(0)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Tilt>
              ))}
              <p className="text-[11px] text-white/40">Grains and dals are raw (dry) weight; meat and fish as labelled. Totals are recalculated from the rounded amounts. Swaps and added foods re-balance the other portions automatically.</p>
            </div>
          )}

          {tab === "training" && (
            <div className="grid gap-4 md:grid-cols-2">
              {train.length ? (
                train.map((d, i) => (
                  <Tilt key={i} className={`p-4 ${trainDay === i ? "ring-1 ring-brand/60" : ""}`} strength={1.5}>
                    <button type="button" onClick={() => setTrainDay(i)} className="w-full text-left">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-soft">{d.focus}</p>
                      <h4 className="font-display text-lg">{d.title}</h4>
                    </button>
                    <ul className="mt-2 grid gap-1 text-xs">
                      {d.items.map((it) => (
                        <li key={it.slug} className="flex justify-between gap-2 border-b border-white/5 pb-1">
                          <span>{it.name}</span>
                          <span className="text-white/55 tabular-nums">
                            {it.sets} × {it.reps} · {it.rest}s
                          </span>
                        </li>
                      ))}
                    </ul>
                    {d.finisher && <p className="mt-2 text-xs text-brand-soft">{d.finisher}</p>}
                    <p className="mt-2 text-[10px] text-white/40">Muscles: {d.muscles.join(", ")} — highlighted on the 3D model.</p>
                  </Tilt>
                ))
              ) : (
                <p className="text-sm text-white/60">Set 2–6 training days to generate a split.</p>
              )}
            </div>
          )}

          {tab === "guidance" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Tilt className="p-5" strength={1.5}>
                <h3 className="font-display text-lg">Supplements — evidence first</h3>
                <ul className="mt-3 grid gap-3 text-sm">
                  {supps.map((s) => (
                    <li key={s.title}>
                      <b>{s.title}</b>
                      <p className="text-white/70">{s.text}</p>
                      <p className="text-[10px] text-white/35">{s.source}</p>
                    </li>
                  ))}
                </ul>
              </Tilt>
              <Tilt className="p-5" strength={1.5}>
                <h3 className="font-display text-lg">Habits</h3>
                <ul className="mt-3 grid gap-3 text-sm">
                  {habits.map((s) => (
                    <li key={s.title}>
                      <b>{s.title}</b>
                      <p className="text-white/70">{s.text}</p>
                      <p className="text-[10px] text-white/35">{s.source}</p>
                    </li>
                  ))}
                </ul>
              </Tilt>
            </div>
          )}

          {tab === "foods" && <FoodData foods={foods} custom={customFoods} setCustom={setFoods} />}

          {tab === "progress" && <Progress log={log} setLog={setLog} weight={p.weightKg} waist={p.m.waist} bf={A.bodyFat} saved={!!clientId} />}
        </section>
      </main>
    </div>
  );
}

function Row({ k, v, band }: { k: string; v: string | number; band: { label: string; tone: "ok" | "warn" | "alert" } }) {
  const c = band.tone === "ok" ? "text-emerald-300" : band.tone === "warn" ? "text-amber-300" : "text-rose-300";
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-white/60">{k}</span>
      <span>
        <b>{v}</b> <span className={`text-[11px] ${c}`}>{band.label}</span>
      </span>
    </div>
  );
}

function DaySummary({ d, T }: { d: ReturnType<typeof planDays>[number]; T: ReturnType<typeof targets> }) {
  const dv = deviation(d, T);
  const cells: [string, number, number, number, string][] = [
    ["kcal", d.total.kcal, T.kcal, dv.kcal, ""],
    ["Protein", d.total.p, T.protein, dv.p, "g"],
    ["Carbs", d.total.c, T.carb, dv.c, "g"],
    ["Fat", d.total.f, T.fat, dv.f, "g"],
  ];
  return (
    <Tilt className="p-4" strength={1}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cells.map(([l, got, want, dev, u]) => (
          <div key={l}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">{l}</p>
            <p className="font-display text-xl">
              {Math.round(got)}
              {u} <span className="text-xs text-white/40">/ {want}{u}</span>
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${Math.abs(dev) <= 5 ? "bg-emerald-400" : Math.abs(dev) <= 10 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${Math.min(100, (got / Math.max(1, want)) * 100)}%` }} />
            </div>
            <p className="mt-0.5 text-[10px] text-white/45">{dev > 0 ? "+" : ""}{dev}%</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-white/45">
        Fibre {Math.round(d.total.fib)} g (target {T.fibre}) · Calcium {Math.round(d.total.ca)} mg (RDA {T.calciumMg}) · Iron {d.total.fe.toFixed(1)} mg (RDA {T.ironMg}) · Potassium {Math.round(d.total.k)} mg · Sodium from foods {Math.round(d.total.na)} mg + cooking salt
      </p>
    </Tilt>
  );
}

function AddFood({ foods, p, onAdd }: { foods: Map<string, FoodItem>; p: ClientProfile; onAdd: (id: string, grams: number) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [grams, setGrams] = useState(50);
  const list = [...foods.values()].filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/75 hover:text-white">
        <Plus className="h-3.5 w-3.5" /> Add food
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-72 rounded-2xl border border-white/10 bg-coal p-3 shadow-2xl">
          <div className="flex gap-2">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods" className="h-9 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-white outline-none" />
            <input type="number" value={grams} min={1} max={1000} onChange={(e) => setGrams(Math.max(1, Math.min(1000, Number(e.target.value) || 0)))} className="h-9 w-16 rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-white" aria-label="grams" />
          </div>
          <ul className="mt-2 max-h-60 overflow-auto text-xs">
            {list.map((f) => {
              const ok = f.diet === "vegan" || (f.diet === "veg" && p.diet !== "vegan") || (f.diet === "egg" && (p.diet === "egg" || p.diet === "nonveg")) || (f.diet === "nonveg" && p.diet === "nonveg");
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    disabled={!ok}
                    onClick={() => {
                      onAdd(f.id, grams);
                      setOpen(false);
                    }}
                    className="flex w-full justify-between gap-2 rounded px-2 py-1 text-left hover:bg-white/10 disabled:opacity-30"
                    title={ok ? "" : "Not allowed in this client's diet"}
                  >
                    <span>{f.name}</span>
                    <span className="text-white/40">{Math.round(f.kcal)}/100</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

type UsdaHit = { fdcId: number; description: string; dataType: string; category: string | null; kcal: number; p: number; c: number; f: number; fib: number; ca: number; fe: number; na: number; k: number };

function FoodData({ foods, custom, setCustom }: { foods: Map<string, FoodItem>; custom: FoodItem[]; setCustom: (f: FoodItem[]) => void }) {
  const [q, setQ] = useState("");
  const [usdaQ, setUsdaQ] = useState("");
  const [hits, setHits] = useState<UsdaHit[]>([]);
  const [state, setState] = useState<"idle" | "busy" | string>("idle");
  const local = [...foods.values()].filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));

  async function search() {
    if (usdaQ.trim().length < 2) return;
    setState("busy");
    try {
      const res = await fetch(`/api/admin/usda?q=${encodeURIComponent(usdaQ)}`);
      const json = (await res.json()) as { foods?: UsdaHit[]; error?: string };
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setHits(json.foods ?? []);
      setState(json.foods?.length ? "idle" : "No matches in USDA Foundation / SR Legacy.");
    } catch (e) {
      setState((e as Error).message);
    }
  }
  function add(h: UsdaHit, diet: FoodItem["diet"], role: FoodItem["role"]) {
    const item: FoodItem = {
      id: `usda-${h.fdcId}`, name: h.description.length > 60 ? `${h.description.slice(0, 57)}…` : h.description,
      kcal: h.kcal, p: h.p, c: h.c, f: h.f, fib: h.fib, ca: h.ca, fe: h.fe, na: h.na, k: h.k,
      diet, allergen: null, jain: false, role, unit: "g", state: "as described", hint: null,
      source: { db: "USDA", ref: String(h.fdcId), desc: `${h.description} (${h.dataType})` },
    };
    setCustom([item, ...custom.filter((f) => f.id !== item.id)]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Tilt className="p-4" strength={1}>
        <h3 className="font-display text-lg">Built-in database ({FOOD_DB.length} foods)</h3>
        <p className="mt-1 text-[11px] text-white/45">Per 100 g edible portion. IFCT 2017 (ICMR-NIN) for Indian foods; USDA FoodData Central SR Legacy for the rest. Hover a source for the original record name.</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" className="mt-3 h-9 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white outline-none" />
        <div className="mt-2 max-h-[420px] overflow-auto">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-coal text-left text-white/40">
              <tr>
                <th className="py-1">Food</th>
                <th className="text-right">kcal</th>
                <th className="text-right">P</th>
                <th className="text-right">C</th>
                <th className="text-right">F</th>
                <th className="pl-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {local.map((f) => (
                <tr key={f.id} className="border-t border-white/5">
                  <td className="py-1 pr-2">{f.name}</td>
                  <td className="text-right tabular-nums">{Math.round(f.kcal)}</td>
                  <td className="text-right tabular-nums">{f.p.toFixed(1)}</td>
                  <td className="text-right tabular-nums">{f.c.toFixed(1)}</td>
                  <td className="text-right tabular-nums">{f.f.toFixed(1)}</td>
                  <td className="pl-2 text-white/45" title={f.source.desc}>
                    {f.source.db} {f.source.db !== "LABEL" && f.source.ref}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tilt>
      <Tilt className="p-4" strength={1}>
        <h3 className="font-display text-lg">Live lookup · USDA FoodData Central</h3>
        <p className="mt-1 text-[11px] text-white/45">Searches the official lab-analysed USDA datasets in real time. Added foods become available in “Add food” for every client on this device.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <input value={usdaQ} onChange={(e) => setUsdaQ(e.target.value)} placeholder="e.g. lentils cooked, avocado, cottage cheese" className="h-9 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white outline-none" />
          <button type="submit" className="btn-brand inline-flex items-center gap-1 rounded-lg px-3 text-xs font-bold" disabled={state === "busy"}>
            {state === "busy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Search
          </button>
        </form>
        {state !== "idle" && state !== "busy" && <p className="mt-2 text-xs text-amber-300">{state}</p>}
        <ul className="mt-3 grid max-h-[300px] gap-2 overflow-auto">
          {hits.map((h) => (
            <UsdaRow key={h.fdcId} h={h} added={custom.some((f) => f.id === `usda-${h.fdcId}`)} onAdd={add} />
          ))}
        </ul>
        {custom.length > 0 && (
          <>
            <h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-white/50">Your added foods</h4>
            <ul className="mt-1 grid gap-1 text-xs">
              {custom.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 rounded bg-black/20 px-2 py-1">
                  <span>
                    {f.name} <span className="text-white/35">FDC {f.source.ref} · {f.diet}</span>
                  </span>
                  <button type="button" aria-label="Remove" onClick={() => setCustom(custom.filter((x) => x.id !== f.id))} className="text-white/40 hover:text-rose-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Tilt>
    </div>
  );
}

function UsdaRow({ h, added, onAdd }: { h: UsdaHit; added: boolean; onAdd: (h: UsdaHit, diet: FoodItem["diet"], role: FoodItem["role"]) => void }) {
  const guessMeat = /\b(chicken|beef|pork|lamb|mutton|goat|fish|salmon|tuna|shrimp|prawn|turkey|bacon|ham|sausage|crab|lobster|cod|sardine|mackerel)\b/i.test(h.description);
  const guessEgg = /\begg/i.test(h.description);
  const guessDairy = /\b(milk|cheese|yogurt|curd|butter|cream|whey|paneer|ghee)\b/i.test(h.description);
  const [diet, setDiet] = useState<FoodItem["diet"]>(guessMeat ? "nonveg" : guessEgg ? "egg" : guessDairy ? "veg" : "vegan");
  const pk = h.p * 4;
  const role: FoodItem["role"] = pk >= 0.4 * h.kcal ? "protein" : h.f * 9 >= 0.6 * h.kcal ? "fat" : h.kcal < 60 ? "veg" : "carb";
  return (
    <li className="rounded-xl bg-black/25 p-2.5 text-xs">
      <p className="font-semibold">{h.description}</p>
      <p className="text-white/50">
        {Math.round(h.kcal)} kcal · P {h.p.toFixed(1)} · C {h.c.toFixed(1)} · F {h.f.toFixed(1)} per 100 g · FDC {h.fdcId} ({h.dataType})
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <select value={diet} onChange={(e) => setDiet(e.target.value as FoodItem["diet"])} className="rounded bg-black/40 px-1 py-0.5 text-white" aria-label="Diet tag">
          <option value="vegan">Vegan</option>
          <option value="veg">Veg (dairy)</option>
          <option value="egg">Egg</option>
          <option value="nonveg">Non-veg</option>
        </select>
        <button type="button" disabled={added} onClick={() => onAdd(h, diet, role)} className="rounded bg-brand/80 px-2 py-0.5 font-bold text-white disabled:opacity-40">
          {added ? "Added" : "Add"}
        </button>
      </div>
    </li>
  );
}

function Progress({ log, setLog, weight, waist, bf, saved }: { log: LogEntry[]; setLog: (l: LogEntry[]) => void; weight: number; waist?: number; bf: number; saved: boolean }) {
  const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <Tilt className="p-5" strength={1}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-display text-lg">Progress log</h3>
        <button type="button" onClick={() => setLog([...log.filter((e) => e.date !== new Date().toISOString().slice(0, 10)), { date: new Date().toISOString().slice(0, 10), weight, waist, bf }])} className="btn-brand rounded-lg px-3 py-2 text-xs font-bold">
          Log today ({weight} kg{waist ? `, waist ${waist} cm` : ""})
        </button>
      </div>
      {!saved && <p className="mt-1 text-[11px] text-amber-300">Save the client to keep this log.</p>}
      {sorted.length >= 2 ? (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sorted} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
              <YAxis yAxisId="w" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} domain={["auto", "auto"]} />
              <YAxis yAxisId="c" orientation="right" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#0a1a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              <Line yAxisId="w" type="monotone" dataKey="weight" name="Weight kg" stroke="#e8394b" strokeWidth={2.5} dot />
              <Line yAxisId="c" type="monotone" dataKey="waist" name="Waist cm" stroke="#7cc0ee" strokeWidth={2} dot connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/50">Log at least two check-ins to see the trend.</p>
      )}
      <ul className="mt-3 grid gap-1 text-xs">
        {sorted
          .slice()
          .reverse()
          .map((e) => (
            <li key={e.date} className="flex justify-between border-b border-white/5 pb-1">
              <span>{e.date}</span>
              <span className="text-white/70">
                {e.weight} kg{e.waist ? ` · waist ${e.waist} cm` : ""}
                {e.bf ? ` · BF ${e.bf}%` : ""}
                <button type="button" onClick={() => setLog(log.filter((x) => x.date !== e.date))} className="ml-2 text-white/35 hover:text-rose-300" aria-label="Delete entry">
                  ×
                </button>
              </span>
            </li>
          ))}
      </ul>
    </Tilt>
  );
}
