import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";

// Short link said in the diet-trial videos (royalfitnesclub.in/diet-trial): the ₹49 7-day trial
// order form. UTM tags on the short link are passed through.
export function GET(request: NextRequest) {
  // Built on SITE_URL, not the request URL: behind Cloud Run the request host is the container's 0.0.0.0:8080.
  const url = new URL("/diet-chart", SITE_URL);
  url.searchParams.set("plan", "trial");
  for (const [k, v] of request.nextUrl.searchParams) if (/^utm_[a-z]+$/.test(k)) url.searchParams.set(k, v.slice(0, 100));
  url.hash = "order";
  return NextResponse.redirect(url, 302);
}
