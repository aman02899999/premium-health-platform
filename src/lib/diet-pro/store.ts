import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FoodItem } from "./types";

// Diet Pro cloud storage. Uses the signed-in admin's own Supabase session, so the
// database's row-level security (public.is_admin()) is the final gate on every row.

export type ClientRecord = {
  id: string;
  name: string;
  profile: unknown;
  swaps: Record<string, number>;
  extras: Record<string, { id: string; grams: number }[]>;
  note: string;
  log: { date: string; weight: number; waist?: number; bf?: number }[];
  consentAt: string;
  consentBy: string;
  updatedAt: string;
};

type Row = {
  id: string;
  name: string;
  profile: unknown;
  swaps: Record<string, number>;
  extras: Record<string, { id: string; grams: number }[]>;
  note: string;
  log: ClientRecord["log"];
  consent_at: string;
  consent_by: string;
  updated_at: string;
};

const fromRow = (r: Row): ClientRecord => ({
  id: r.id,
  name: r.name,
  profile: r.profile,
  swaps: r.swaps ?? {},
  extras: r.extras ?? {},
  note: r.note ?? "",
  log: r.log ?? [],
  consentAt: r.consent_at,
  consentBy: r.consent_by,
  updatedAt: r.updated_at,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID.test(s);

export async function listClients(): Promise<ClientRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("diet_clients").select("id,name,profile,swaps,extras,note,log,consent_at,consent_by,updated_at").order("updated_at", { ascending: false }).limit(1000);
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

/** Insert or update. `consentAt` must be set: the table refuses rows without it. */
export async function saveClient(input: Omit<ClientRecord, "id" | "updatedAt"> & { id?: string }, by: string): Promise<ClientRecord> {
  const supabase = await createClient();
  const row = {
    name: input.name.trim().slice(0, 80),
    profile: input.profile,
    swaps: input.swaps ?? {},
    extras: input.extras ?? {},
    note: (input.note ?? "").slice(0, 2000),
    log: (input.log ?? []).slice(-500),
    consent_at: input.consentAt,
    consent_by: input.consentBy.slice(0, 200),
    updated_at: new Date().toISOString(),
    updated_by: by.slice(0, 200),
  };
  const q = isUuid(input.id) ? supabase.from("diet_clients").update(row).eq("id", input.id) : supabase.from("diet_clients").insert(row);
  const { data, error } = await q.select("id,name,profile,swaps,extras,note,log,consent_at,consent_by,updated_at").single();
  if (error) throw new Error(error.message);
  return fromRow(data as Row);
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("diet_clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listFoods(): Promise<FoodItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("diet_foods").select("item").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as { item: FoodItem }[]).map((r) => r.item);
}

export async function saveFood(item: FoodItem, by: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("diet_foods").upsert({ id: item.id, item, created_by: by.slice(0, 200) });
  if (error) throw new Error(error.message);
}

export async function deleteFood(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("diet_foods").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

const num = (v: unknown, lo: number, hi: number) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

/** Shape check for a coach-added USDA food before it is stored. */
export function validFood(f: unknown): f is FoodItem {
  const x = f as FoodItem;
  return (
    !!x &&
    typeof x.id === "string" &&
    /^usda-\d{1,10}$/.test(x.id) &&
    typeof x.name === "string" &&
    x.name.length > 0 &&
    x.name.length <= 80 &&
    num(x.kcal, 0, 950) &&
    num(x.p, 0, 100) &&
    num(x.c, 0, 100) &&
    num(x.f, 0, 100) &&
    ["vegan", "veg", "egg", "nonveg"].includes(x.diet) &&
    ["carb", "legume", "protein", "dairy", "fat", "veg", "fruit"].includes(x.role) &&
    x.source?.db === "USDA"
  );
}
