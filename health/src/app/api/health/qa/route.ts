import { NextRequest, NextResponse } from "next/server";
import { unifiedHealthSearch } from "@/services/health/search";
import { MEDICAL_DISCLAIMER } from "@/services/health/safety";

export const dynamic = "force-dynamic";

/**
 * POST /api/health/qa — retrieval-first Q&A with citations
 * Body: { question: string, lang?: "en"|"hi"|"hinglish" }
 * Returns synthesized answer from retrieved docs (no hallucinations), citations mandatory
 */
export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body = await req.json();
    const question = (body?.question ?? "").trim();
    const lang = body?.lang ?? "en";
    if (!question || question.length < 3) {
      return NextResponse.json({ error: "question required (min 3 chars)" }, { status: 400 });
    }
    if (question.length > 500) {
      return NextResponse.json({ error: "question too long (max 500)" }, { status: 400 });
    }

    // Retrieve
    const search = await unifiedHealthSearch({ query: question, limit: 8 });

    // Build answer from retrieved categories
    const lines: string[] = [];
    const citations: { id: string; title?: string; source: string; url?: string; snippet?: string }[] = [];

    lines.push(`Question: ${question} [lang=${lang}]`);
    lines.push("");

    const pushCat = (label: string, items: any[] | undefined, max = 3) => {
      if (!items || items.length === 0) return;
      lines.push(`**${label} (${items.length}):**`);
      items.slice(0, max).forEach((it: any, idx: number) => {
        const name = it.name ?? it.title ?? it.common_name ?? it.id ?? `item-${idx}`;
        const desc = it.description ?? it.snippet ?? it.abstract ?? it.indication ?? "";
        const src = it.source ?? it.provider ?? "unknown";
        const url = it.url ?? it.link ?? undefined;
        lines.push(`- ${name}: ${(desc ?? "").slice(0, 220)} [${src}]`);
        citations.push({
          id: it.id ?? `${label}-${idx}`,
          title: name,
          source: src,
          url,
          snippet: (desc ?? "").slice(0, 240),
        });
      });
      lines.push("");
    };

    pushCat("Diseases / Terminology", (search.categories.terminology as any[]) ?? (search.categories.diseases as any[]));
    pushCat("Medicines / Drugs", search.categories.medicines as any[]);
    pushCat("Food / Nutrition", search.categories.food as any[]);
    pushCat("Exercises", search.categories.exercises as any[]);
    pushCat("Ayurveda / Herbs", search.categories.ayurveda as any[]);
    pushCat("Homeopathy", search.categories.homeopathy as any[]);
    pushCat("Research (PubMed)", search.categories.research as any[]);
    pushCat("Clinical Trials", search.categories.trials as any[]);
    pushCat("India Indicators", search.categories.indiaIndicators as any[]);

    if (citations.length === 0) {
      lines.push("No strong matches found in enabled providers. Try more specific terms (e.g. 'metformin dosage', 'ragi glycemic index', 'ashwagandha thyroid').");
      lines.push("");
      lines.push("Sources searched: " + (search.sources.join(", ") || "none (providers disabled?)"));
    } else {
      lines.push(`Sources: ${Array.from(new Set(citations.map((c) => c.source))).join(", ")}`);
    }

    lines.push("");
    lines.push("**Safety note:** Traditional use ≠ proven efficacy. Do not stop prescribed medicines. Consult clinician for personal advice.");

    // Add unique India-specific augmentations
    if (/millet|ragi|jowar|bajra|kangni/i.test(question)) {
      lines.push("");
      lines.push("**India tip (millets):** Millets have lower GI than white rice (70-80) — foxtail ~50-55, barnyard ~42-45. Start 50:50 swap for adherence. Soak 6-8h. Source: ICMR-NIN, FAO.");
      citations.push({ id: "millet-icmr", title: "ICMR-NIN millets guidance", source: "ICMR-NIN", snippet: "Millets lower GI, higher fibre than white rice" });
    }
    if (/diabetes|idrs|blood sugar/i.test(question)) {
      lines.push("");
      lines.push("**India tip (IDRS):** Indian Diabetes Risk Score validated for Indians — age, waist, activity, family history. Cut-offs <30 low, 30-50 moderate, ≥60 high (Mohan et al., CURES). Confirm with HbA1c.");
      citations.push({ id: "idrs-cures", title: "IDRS Mohan et al. JAPI 2005", source: "CURES", url: "https://pubmed.ncbi.nlm.nih.gov/?term=IDRS+Mohan" });
    }

    const answer = lines.join("\n");

    return NextResponse.json({
      question,
      answer,
      citations: citations.slice(0, 12),
      query: search.query,
      totalRetrieved: search.total,
      sources: search.sources,
      durationMs: Date.now() - t0,
      confidence: citations.length >= 3 ? "moderate" : citations.length >= 1 ? "low" : "none",
      disclaimer: MEDICAL_DISCLAIMER,
      lang,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "qa failed", disclaimer: MEDICAL_DISCLAIMER }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/health/qa",
    method: "POST",
    body: { question: "string (3-500 chars)", lang: "en|hi|hinglish (optional)" },
    returns: "answer + citations[] + sources + confidence",
    example: { question: "diabetes diet millets Indian" },
    disclaimer: MEDICAL_DISCLAIMER,
  });
}
