import { NextResponse } from "next/server";
import { APK_URL } from "@/lib/app-download";

// A short link to share (royalfitnesclub.in/app/download) that always gets the newest Android app.
export function GET() {
  return NextResponse.redirect(APK_URL, 302);
}
