import { getContent } from "@/lib/content/store";
import { resultsPdf } from "@/lib/content/docs-pdf";
import { publishedStudies } from "@/lib/content/results";
import { todayIST } from "@/lib/growth/dates";

export const revalidate = 300;

export async function GET() {
  const c = await getContent();
  const studies = publishedStudies(c.caseStudies);
  // No consented results yet: nothing to prove, so no document.
  if (!studies.length) return new Response("No published results yet", { status: 404 });
  const pdf = await resultsPdf(c, studies, todayIST());
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="royal-fitness-club-proof-of-results.pdf"',
      "cache-control": "public, max-age=300",
    },
  });
}
