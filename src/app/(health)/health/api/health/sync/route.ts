import { NextResponse } from "next/server";
import { syncAll, syncFoods, syncExercises, syncDrugs, syncHerbs, syncMedicalLiterature, syncClinicalTrials, listJobs, getSyncCapabilities, clearCacheForProvider } from "@/health/services/health/sync";
import { isManager } from "@/lib/auth";
import { cronAuthorized } from "@/lib/cron-auth";

// Starting or clearing sync jobs costs third-party API quota: the admin or the cron only.
async function adminOrCron(req: Request) {
  return cronAuthorized(req, process.env, { allowUnsetInDev: false }) || (await isManager());
}

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "jobs") {
    return NextResponse.json({ jobs: listJobs(), fetchedAt: new Date().toISOString() });
  }
  if (action === "capabilities") {
    return NextResponse.json({ capabilities: getSyncCapabilities(), fetchedAt: new Date().toISOString() });
  }

  return NextResponse.json({
    message: "Health sync API",
    endpoints: {
      "GET ?action=jobs": "List sync jobs",
      "GET ?action=capabilities": "List sync capabilities",
      "POST { jobType: foods|exercises|drugs|herbs|medical-literature|clinical-trials|all }": "Trigger sync",
      "DELETE ?provider=wger": "Clear cache for provider",
    },
    jobs: listJobs().slice(0, 5),
  });
}

export async function POST(req: Request) {
  if (!(await adminOrCron(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const jobType = (body.jobType || "all") as string;

    let result;
    switch (jobType) {
      case "foods":
        result = await syncFoods();
        break;
      case "exercises":
        result = await syncExercises();
        break;
      case "drugs":
        result = await syncDrugs();
        break;
      case "herbs":
        result = await syncHerbs();
        break;
      case "medical-literature":
        result = await syncMedicalLiterature();
        break;
      case "clinical-trials":
        result = await syncClinicalTrials();
        break;
      case "all":
      default:
        const all = await syncAll();
        return NextResponse.json({ message: "All syncs completed", jobs: all, fetchedAt: new Date().toISOString() });
    }

    return NextResponse.json({ message: `${jobType} sync completed`, job: result, fetchedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[health sync] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await adminOrCron(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  if (!provider) return NextResponse.json({ error: "Missing ?provider=" }, { status: 400 });
  const cleared = clearCacheForProvider(provider);
  return NextResponse.json({ message: `Cleared ${cleared} cache entries for ${provider}`, cleared, provider, fetchedAt: new Date().toISOString() });
}
