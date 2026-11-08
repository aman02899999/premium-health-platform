// Home-sample lab booking partners shown on the lab-test pages. Each link is the owner's own
// affiliate link from Cuelinks (or the lab's network), pasted into Vercel. They are public by
// design: they appear in the page like any link. A partner with no link set is not shown, so
// nothing appears until the owner is approved and adds the link.

export type LabPartner = { id: string; name: string; url: string };

const PARTNERS: { id: string; name: string; env: string | undefined }[] = [
  { id: "lab-1mg", name: "Tata 1mg Labs", env: process.env.NEXT_PUBLIC_LAB_LINK_1MG },
  { id: "lab-redcliffe", name: "Redcliffe Labs", env: process.env.NEXT_PUBLIC_LAB_LINK_REDCLIFFE },
];

/** Only full https links count; anything else (blank, typo, http) hides that partner. */
export function safeLink(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function labPartners(list = PARTNERS): LabPartner[] {
  return list.flatMap((p) => {
    const url = safeLink(p.env);
    return url ? [{ id: p.id, name: p.name, url }] : [];
  });
}
