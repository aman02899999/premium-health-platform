"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ApiKey = {
  keyId: string;
  name: string;
  plan: string;
  keyPrefix: string;
  status: "active" | "revoked";
  environment: "live" | "test";
  requestCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

type KeyUsage = {
  keyId: string;
  name: string;
  plan: string;
  status: string;
  requestsToday: number;
  errorsToday: number;
  limitPerDay: number | "unlimited";
  remainingToday: number | "unlimited";
  percentUsed: number;
  resetsAt: string;
  topEndpoints: { endpoint: string; requests: number }[];
};

type UsageTotals = { keys: number; activeKeys: number; requestsToday: number; errorsToday: number };

type Billing = {
  plan: { id: string; name: string; priceLabel: string; requestsPerDay: number; requestsPerMinute: number; bulkExport: boolean; attributionRequired: boolean };
  subscription: Subscription | null;
  subscriptions: Subscription[];
  billing: { provider: string; realPaymentsEnabled: boolean; mode: "live" | "simulated"; reason: string };
};

type Subscription = {
  subscriptionId: string;
  plan: string;
  planName: string;
  status: "active" | "past_due" | "cancelled";
  amountPaise: number;
  currency: string;
  provider: string;
  invoicePaid: boolean;
  demo: boolean;
  currentPeriodEnd: string;
};

const SELF_SERVE = [
  { id: "starter", name: "Starter", price: "₹1,499/month", quota: "50,000 requests/day · 120/min" },
  { id: "pro", name: "Pro", price: "₹6,999/month", quota: "500,000 requests/day · 600/min + bulk export" },
];

type Snapshot = {
  signedOut: boolean;
  keys: ApiKey[];
  usage: KeyUsage[];
  totals: UsageTotals | null;
  billing: Billing | null;
};

/**
 * Reads the dashboard's whole state in one round trip pair.
 *
 * Kept outside the component so the mount effect can await it without performing
 * a synchronous setState (see react-hooks/set-state-in-effect), and so a signed-out
 * visitor is detected from the 401 rather than a separate session probe.
 */
async function fetchSnapshot(): Promise<Snapshot> {
  const [keysRes, usageRes, billingRes] = await Promise.all([
    fetch("/api/v1/keys", { cache: "no-store" }),
    fetch("/api/v1/keys/usage", { cache: "no-store" }),
    fetch("/api/v1/billing/subscription", { cache: "no-store" }),
  ]);

  if (keysRes.status === 401) {
    return { signedOut: true, keys: [], usage: [], totals: null, billing: null };
  }
  if (!keysRes.ok) throw new Error(`Could not load keys (HTTP ${keysRes.status})`);

  const keysBody = (await keysRes.json()) as { data?: { keys?: ApiKey[] } };

  let usageKeys: KeyUsage[] = [];
  let totals: UsageTotals | null = null;
  if (usageRes.ok) {
    const usageBody = (await usageRes.json()) as { data?: { keys?: KeyUsage[]; totals?: UsageTotals } };
    usageKeys = usageBody.data?.keys ?? [];
    totals = usageBody.data?.totals ?? null;
  }

  let billing: Billing | null = null;
  if (billingRes.ok) {
    const billingBody = (await billingRes.json()) as { data?: Billing };
    billing = billingBody.data ?? null;
  }

  return { signedOut: false, keys: keysBody.data?.keys ?? [], usage: usageKeys, totals, billing };
}

const dateLabel = (iso: string | null) => {
  if (!iso) return "never";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
};

export default function DeveloperDashboard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<KeyUsage[]>([]);
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [environment, setEnvironment] = useState<"live" | "test">("live");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const applySnapshot = (snap: Snapshot) => {
    setSignedOut(snap.signedOut);
    setKeys(snap.keys);
    setUsage(snap.usage);
    setTotals(snap.totals);
    setBilling(snap.billing);
  };

  // Used by the create/revoke handlers after a mutation.
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      applySnapshot(await fetchSnapshot());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Mount-time load. `loading` already starts as true, and every setState here
    // happens after an await, so mounting does not cascade an extra render.
    let cancelled = false;
    void (async () => {
      try {
        const snap = await fetchSnapshot();
        if (cancelled) return;
        setSignedOut(snap.signedOut);
        setKeys(snap.keys);
        setUsage(snap.usage);
        setTotals(snap.totals);
        setBilling(snap.billing);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const createKey = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Default key", environment }),
      });
      const body = (await res.json()) as { ok?: boolean; data?: { key?: string }; error?: { message?: string } };
      if (!res.ok || !body.ok || !body.data?.key) {
        throw new Error(body.error?.message || `Could not create key (HTTP ${res.status})`);
      }
      setCreatedKey(body.data.key);
      setCopied(false);
      setNewKeyName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create key");
    } finally {
      setBusy(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/keys/${keyId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body.error?.message || `Could not revoke key (HTTP ${res.status})`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke key");
    } finally {
      setBusy(false);
    }
  };

  const startCheckout = async (plan: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        data?: { subscription?: Subscription; order?: { providerOrderId?: string | null }; mode?: string };
        error?: { message?: string };
      };
      if (!res.ok || !body.ok || !body.data?.subscription) {
        throw new Error(body.error?.message || `Could not start checkout (HTTP ${res.status})`);
      }
      // Sandbox providers settle immediately; a real provider redirects to checkout.
      const subscriptionId = body.data.subscription.subscriptionId;
      if (body.data.mode === "simulated") {
        const confirm = await fetch("/api/v1/billing/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subscriptionId, paymentId: `sandbox_${subscriptionId}` }),
        });
        const confirmBody = (await confirm.json()) as { ok?: boolean; error?: { message?: string } };
        if (!confirm.ok || !confirmBody.ok) {
          throw new Error(confirmBody.error?.message || "Sandbox verification failed");
        }
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  };

  const cancelSubscription = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/billing/subscription", { method: "DELETE" });
      const body = (await res.json()) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok || !body.ok) throw new Error(body.error?.message || `Could not cancel (HTTP ${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel subscription");
    } finally {
      setBusy(false);
    }
  };

  const copyKey = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (signedOut) {
    return (
      <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-700/50 dark:bg-amber-950/20">
        <h2 className="font-display text-xl font-black">Sign in to manage API keys</h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
          The dashboard is tied to your account so keys can be revoked and usage attributed.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/login" className="rounded-xl bg-emerald-700 px-5 py-2.5 font-bold text-white hover:bg-emerald-600">Sign in</Link>
          <Link href="/developers/docs" className="rounded-xl border border-stone-300 px-5 py-2.5 font-bold dark:border-stone-600">Read the docs first</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </p>
      )}

      {createdKey && (
        <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-5 dark:bg-emerald-950/20">
          <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Copy this key now — it is shown once</p>
          <code className="mt-2 block break-all rounded-xl bg-white p-3 text-xs font-bold dark:bg-stone-900">{createdKey}</code>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={copyKey} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-600">
              {copied ? "Copied ✓" : "Copy key"}
            </button>
            <button type="button" onClick={() => setCreatedKey(null)} className="rounded-xl border border-stone-300 px-4 py-2 font-bold dark:border-stone-600">
              I have saved it
            </button>
          </div>
          <p className="mt-2 text-[11px] text-stone-600 dark:text-stone-300">
            Stored as a SHA-256 hash — if you lose it, revoke this key and create another. Try it: {" "}
            <code className="rounded bg-white px-1 dark:bg-stone-900">curl -H &quot;x-api-key: KEY&quot; /api/v1/usage</code>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active keys", value: totals ? `${totals.activeKeys}/${totals.keys}` : "—" },
          { label: "Requests today", value: totals ? totals.requestsToday.toLocaleString("en-IN") : "—" },
          { label: "Errors today", value: totals ? totals.errorsToday.toLocaleString("en-IN") : "—" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-200 p-5 dark:border-stone-700">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{card.label}</p>
            <p className="font-display mt-1 text-2xl font-black">{loading ? "…" : card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-stone-200 p-5 dark:border-stone-700">
        <h2 className="font-display text-lg font-black">Plan &amp; billing</h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Plan and quota are tied to the subscription, never to the request that created a key.
        </p>

        <div className="mt-4 rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Current plan</p>
          <p className="font-display mt-1 text-xl font-black">
            {billing ? `${billing.plan.name} · ${billing.plan.priceLabel}` : "—"}
          </p>
          {billing?.subscription ? (
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
              {billing.subscription.status === "active" ? "Active" : billing.subscription.status} ·{" "}
              {billing.subscription.invoicePaid ? "paid invoice" : billing.subscription.demo ? "sandbox activation (not billed)" : "awaiting payment"} · renews{" "}
              {dateLabel(billing.subscription.currentPeriodEnd)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
              Free tier — 1,000 requests/day. Attribution back to Bharat Health Guide is required.
            </p>
          )}

          {billing && (
            <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
              Billing provider: <strong>{billing.billing.provider}</strong> ·{" "}
              {billing.billing.realPaymentsEnabled ? (
                <span className="font-bold text-emerald-700 dark:text-emerald-300">real payments enabled</span>
              ) : (
                <span className="font-bold text-amber-700 dark:text-amber-300">sandbox — activations are recorded as demo</span>
              )}
              {!billing.billing.realPaymentsEnabled && <> ({billing.billing.reason})</>}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SELF_SERVE.map((plan) => {
            const current = billing?.subscription?.plan === plan.id && billing.subscription.status === "active";
            return (
              <div key={plan.id} className={`rounded-2xl border p-4 ${current ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-stone-200 dark:border-stone-700"}`}>
                <p className="font-bold">{plan.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{plan.price}</p>
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">{plan.quota}</p>
                {current ? (
                  <button
                    type="button"
                    onClick={cancelSubscription}
                    disabled={busy}
                    className="mt-3 rounded-xl border border-red-300 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    Cancel subscription
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCheckout(plan.id)}
                    disabled={busy}
                    className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {busy ? "Working…" : `Subscribe to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400">
          Enterprise (unlimited, custom rate limits) is contract-based — see{" "}
          <Link href="/partner-with-us" className="font-bold text-emerald-700 underline dark:text-emerald-300">
            partner with us
          </Link>
          .
        </p>
      </section>

      <section className="rounded-3xl border border-stone-200 p-5 dark:border-stone-700">
        <h2 className="font-display text-lg font-black">Create a key</h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          New keys start on the Free plan. Use a test key for staging so production usage stays separable in the metrics.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
            Label
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production app"
              className="mt-1 block w-56 rounded-xl border border-stone-300 px-3 py-2 text-sm font-normal dark:border-stone-600 dark:bg-stone-800"
            />
          </label>
          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
            Environment
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value === "test" ? "test" : "live")}
              className="mt-1 block w-36 rounded-xl border border-stone-300 px-3 py-2 text-sm font-normal dark:border-stone-600 dark:bg-stone-800"
            >
              <option value="live">live</option>
              <option value="test">test</option>
            </select>
          </label>
          <button
            type="button"
            onClick={createKey}
            disabled={busy}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {busy ? "Working…" : "Create API key"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 p-5 dark:border-stone-700">
        <h2 className="font-display text-lg font-black">Your keys</h2>
        {loading ? (
          <p className="mt-3 text-sm text-stone-500">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">No keys yet — create one above to start calling the API.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {keys.map((key) => {
              const keyUsage = usage.find((u) => u.keyId === key.keyId);
              return (
                <li key={key.keyId} className={`rounded-2xl border p-4 ${key.status === "revoked" ? "border-stone-200 opacity-60 dark:border-stone-700" : "border-stone-200 dark:border-stone-700"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{key.name}</span>
                    <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] dark:bg-stone-800">{key.keyPrefix}…</code>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">{key.plan}</span>
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-stone-600 dark:bg-stone-800 dark:text-stone-300">{key.environment}</span>
                    {key.status === "revoked" && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-800 dark:bg-red-900/40 dark:text-red-200">revoked</span>}
                  </div>

                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-stone-500 sm:grid-cols-4 dark:text-stone-400">
                    <div><dt className="font-bold">Created</dt><dd>{dateLabel(key.createdAt)}</dd></div>
                    <div><dt className="font-bold">Last used</dt><dd>{dateLabel(key.lastUsedAt)}</dd></div>
                    <div><dt className="font-bold">Lifetime requests</dt><dd>{key.requestCount.toLocaleString("en-IN")}</dd></div>
                    <div>
                      <dt className="font-bold">Today</dt>
                      <dd>
                        {keyUsage ? `${keyUsage.requestsToday} / ${keyUsage.limitPerDay === "unlimited" ? "∞" : keyUsage.limitPerDay}` : "0"}
                      </dd>
                    </div>
                  </dl>

                  {keyUsage && keyUsage.limitPerDay !== "unlimited" && (
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                        <div
                          className={`h-full rounded-full ${keyUsage.percentUsed > 90 ? "bg-red-500" : keyUsage.percentUsed > 70 ? "bg-amber-500" : "bg-emerald-600"}`}
                          style={{ width: `${Math.max(keyUsage.percentUsed, 1)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                        {keyUsage.percentUsed}% of today&apos;s quota used · resets {dateLabel(keyUsage.resetsAt)}
                      </p>
                    </div>
                  )}

                  {keyUsage && keyUsage.topEndpoints.length > 0 && (
                    <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                      Top endpoints: {keyUsage.topEndpoints.map((e) => `${e.endpoint} (${e.requests})`).join(", ")}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    {key.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => revokeKey(key.keyId)}
                        disabled={busy}
                        className="rounded-xl border border-red-300 px-3 py-1.5 font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-stone-400">Revoked — create a new key to restore access.</span>
                    )}
                    <Link href="/developers/docs" className="rounded-xl border border-stone-300 px-3 py-1.5 font-bold dark:border-stone-600">Endpoint reference</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
