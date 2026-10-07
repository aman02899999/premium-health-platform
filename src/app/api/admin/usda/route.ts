import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Live lookup in USDA FoodData Central (official US government food-composition data) for the
// admin Diet Pro planner. Only the non-branded, lab-analysed datasets are searched.
// USDA_API_KEY is optional: without it the public DEMO_KEY is used (low hourly limit).

type FdcNutrient = { nutrientId?: number; value?: number };
type FdcFood = { fdcId: number; description: string; dataType: string; foodCategory?: string; foodNutrients?: FdcNutrient[] };

const N = { kcal: 1008, kcalAtwaterGeneral: 2047, kcalAtwaterSpecific: 2048, p: 1003, f: 1004, c: 1005, fib: 1079, ca: 1087, fe: 1089, na: 1093, k: 1092 };

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ foods: [] });
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(q)}&dataType=${encodeURIComponent("Foundation,SR Legacy")}&pageSize=12`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch {
    return NextResponse.json({ error: "USDA FoodData Central did not respond. Try again." }, { status: 502 });
  }
  if (res.status === 429) return NextResponse.json({ error: "USDA hourly limit reached. Add a free USDA_API_KEY (api.data.gov) in Vercel to raise it." }, { status: 429 });
  if (!res.ok) return NextResponse.json({ error: `USDA FoodData Central returned ${res.status}.` }, { status: 502 });
  const json = (await res.json()) as { foods?: FdcFood[] };
  const foods = (json.foods ?? []).map((f) => {
    const v = (id: number) => f.foodNutrients?.find((n) => n.nutrientId === id)?.value;
    const p = v(N.p) ?? 0;
    const fat = v(N.f) ?? 0;
    const c = v(N.c) ?? 0;
    const kcal = v(N.kcal) ?? v(N.kcalAtwaterSpecific) ?? v(N.kcalAtwaterGeneral) ?? p * 4 + c * 4 + fat * 9;
    return {
      fdcId: f.fdcId,
      description: f.description,
      dataType: f.dataType,
      category: f.foodCategory ?? null,
      kcal, p, c, f: fat,
      fib: v(N.fib) ?? 0,
      ca: v(N.ca) ?? 0,
      fe: v(N.fe) ?? 0,
      na: v(N.na) ?? 0,
      k: v(N.k) ?? 0,
    };
  });
  return NextResponse.json({ foods, source: "USDA FoodData Central (Foundation + SR Legacy)" });
}
