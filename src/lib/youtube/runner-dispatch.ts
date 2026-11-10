// GitHub starts scheduled workflows late or skips them when it is busy: the hourly Uptime check
// ran only 3–5 times a day in early November. Vercel's crons fire every day, so each YouTube cron
// also asks GitHub to start the Shorts workflow straight away. The site claims each slot once,
// so a scheduled run that does turn up later finds the slot taken and does nothing.
//
// Needs GITHUB_DISPATCH_TOKEN in Vercel: a fine-grained GitHub token for this repository only,
// with "Actions: read and write". Without it nothing changes (GitHub's own schedule is used).

export type DispatchResult = "github-runner" | "github-dispatched" | `dispatch-failed: ${string}`;

const WORKFLOW = "youtube-shorts.yml";
const DEFAULT_REPO = "aman02899999/premium-health-platform";

export async function dispatchRunner(
  slot: string,
  env: Record<string, string | undefined> = process.env,
  doFetch: typeof fetch = fetch,
): Promise<DispatchResult> {
  const token = env.GITHUB_DISPATCH_TOKEN;
  if (!token) return "github-runner";
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  try {
    const res = await doFetch(`https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json",
        "user-agent": "royal-fitness-cron",
      },
      body: JSON.stringify({ ref: "main", inputs: { slot } }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return "github-dispatched";
    const body = (await res.json().catch(() => ({}))) as { message?: unknown };
    const message = typeof body.message === "string" ? ` ${body.message.slice(0, 120)}` : "";
    return `dispatch-failed: HTTP ${res.status}${message}`;
  } catch (err) {
    return `dispatch-failed: ${(err as Error).message.slice(0, 120)}`;
  }
}
