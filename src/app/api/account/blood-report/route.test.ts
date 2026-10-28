import { beforeEach, describe, expect, it, vi } from "vitest";

const viewer = vi.fn();
const saveReport = vi.fn(async () => "11111111-1111-1111-1111-111111111111");
const deleteReports = vi.fn(async () => 1);
vi.mock("server-only", () => ({}));
vi.mock("@/health/db", () => ({ isDbConfigured: true }));
vi.mock("@/lib/lab/session", () => ({ labViewer: () => viewer() }));
vi.mock("@/lib/lab/store", async () => {
  const { MARKERS } = await import("@/lib/lab/markers");
  return { liveMarkers: async () => MARKERS, saveReport, deleteReports, reportsFor: async () => [], countUsage: async () => {}, savingEnabled: () => true };
});

const { POST, DELETE, GET } = await import("./route");
const req = (method: string, body: unknown) => new Request("http://localhost/api/account/blood-report", { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const report = { consent: true, sex: "female", age: 34, results: [{ name: "SGPT", value: 51, unit: "U/L", reportLow: 10, reportHigh: 49 }] };

describe("member blood report API", () => {
  beforeEach(() => {
    viewer.mockReset();
    saveReport.mockClear();
    deleteReports.mockClear();
  });

  it("needs sign-in", async () => {
    viewer.mockResolvedValue(null);
    expect((await POST(req("POST", report))).status).toBe(401);
  });

  it("needs access switched on to analyse", async () => {
    viewer.mockResolvedValue({ email: "m@x.in", allowed: false });
    expect((await POST(req("POST", report))).status).toBe(403);
  });

  it("analyses with the report's own range and stores nothing unless asked", async () => {
    viewer.mockResolvedValue({ email: "m@x.in", allowed: true });
    const res = await POST(req("POST", report));
    expect(res.headers.get("cache-control")).toContain("no-store");
    const j = await res.json();
    expect(j.analysis.results[0]).toMatchObject({ status: "high", range: { from: "report", low: 10, high: 49 }, marker: { id: "alt" } });
    expect(j.savedId).toBeNull();
    expect(saveReport).not.toHaveBeenCalled();
    await POST(req("POST", { ...report, save: true }));
    expect(saveReport).toHaveBeenCalledOnce();
  });

  it("refuses without consent", async () => {
    viewer.mockResolvedValue({ email: "m@x.in", allowed: true });
    expect((await POST(req("POST", { ...report, consent: false }))).status).toBe(400);
  });

  it("lets a member whose access ended still see and delete their reports", async () => {
    viewer.mockResolvedValue({ email: "m@x.in", allowed: false });
    expect((await GET()).status).toBe(200);
    const res = await DELETE(req("DELETE", { all: true }));
    expect(res.status).toBe(200);
    expect(deleteReports).toHaveBeenCalledWith("m@x.in", null);
  });
});
