import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as dietTrial } from "./route";
import { GET as pack } from "../library/pack/[id]/route";

// Behind Cloud Run the request reaches the app as http://0.0.0.0:8080; redirects must still point at the real site.
const req = (path: string) => new NextRequest(`http://0.0.0.0:8080${path}`);

describe("short-link redirects", () => {
  it("/diet-trial goes to the trial form on the public site, keeping UTM tags", () => {
    const loc = dietTrial(req("/diet-trial?utm_source=youtube&x=1")).headers.get("location")!;
    expect(loc).toBe("https://www.royalfitnesclub.in/diet-chart?plan=trial&utm_source=youtube#order");
  });

  it("/library/pack/<id> opens checkout on the public site", async () => {
    const res = await pack(req("/library/pack/indian-food?utm_source=youtube"), { params: Promise.resolve({ id: "indian-food" }) });
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin).toBe("https://www.royalfitnesclub.in");
    expect(loc.pathname).toBe("/library/checkout");
    expect(loc.searchParams.get("utm_content")).toBe("indian-food");
  });

  it("an unknown pack falls back to the library on the public site", async () => {
    const res = await pack(req("/library/pack/nope"), { params: Promise.resolve({ id: "nope" }) });
    expect(res.headers.get("location")).toBe("https://www.royalfitnesclub.in/library");
  });
});
