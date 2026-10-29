import { assetLinks, certFingerprints } from "@/lib/app-download";

// Android reads this to confirm the Royal Fitness app may open this site full screen.
export function GET() {
  return Response.json(assetLinks(certFingerprints()), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
