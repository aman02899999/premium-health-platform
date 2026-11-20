import { NextResponse, type NextRequest } from "next/server";

// Short link said in the diet-trial videos (royalfitnesclub.in/diet-trial): the ₹49 7-day trial
// order form. UTM tags on the short link are passed through.
export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/diet-chart";
  url.search = "";
  url.searchParams.set("plan", "trial");
  for (const [k, v] of request.nextUrl.searchParams) if (/^utm_[a-z]+$/.test(k)) url.searchParams.set(k, v.slice(0, 100));
  url.hash = "order";
  return NextResponse.redirect(url, 302);
}
