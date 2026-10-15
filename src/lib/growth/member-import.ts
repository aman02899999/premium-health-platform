// Turns the rows of a member list (any column order, Indian date formats, Excel serial dates)
// into clean member records. Pure, so every rule is unit-tested; the database step is in members.ts.
import { addDays, expiryFor, isIsoDate, parseDuration } from "./dates";

export type Field = "name" | "phone" | "email" | "plan" | "start" | "end" | "duration" | "notes";
export type Mapping = Partial<Record<Field, { column: number; header: string }>>;
export type Candidate = { row: number; name: string; phone: string; email: string | null; planName: string; startOn: string; expiresOn: string; notes: string };
export type RowError = { row: number; message: string };

export const MAX_ROWS = 3000;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Checked in this order; the first rule a header matches wins, and each field takes one column.
const RULES: [Field, (h: string) => boolean][] = [
  ["email", (h) => h.includes("mail")],
  ["phone", (h) => /mobile|phone|whatsapp|contact|^mob(no)?$|^cell|^number$|^no$/.test(h)],
  ["end", (h) => /expir|valid(till|upto|itydate|itytill)|till|duedate|^due$|end(s?on|date)?$|renewal|^todate$|^to$/.test(h)],
  ["start", (h) => /join|start|admission|^doj$|^fromdate$|^from$|^since$/.test(h)],
  ["duration", (h) => /^(duration|months?|period|validity|tenure|noofmonths)$/.test(h)],
  ["plan", (h) => /plan|package|membership|scheme|batch/.test(h) && !/amount|fee|price|paid|rs$|inr/.test(h)],
  ["notes", (h) => /note|remark|comment/.test(h)],
  ["name", (h) => /name|^member$|^client$|^customer$|^naam$/.test(h)],
];

export function mapHeader(header: string[]): Mapping {
  const out: Mapping = {};
  header.forEach((raw, column) => {
    const h = norm(raw);
    if (!h) return;
    const field = RULES.find(([f, test]) => !out[f] && test(h))?.[0];
    if (field) out[field] = { column, header: raw.trim() };
  });
  return out;
}

/** The header is the first of the top 10 rows that names at least a name and a phone column. */
export function findHeader(rows: string[][]): { index: number; mapping: Mapping } | null {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const mapping = mapHeader(rows[i]);
    if (mapping.name && mapping.phone) return { index: i, mapping };
  }
  return null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");
const year = (y: string) => (y.length === 2 ? 2000 + Number(y) : Number(y));
const iso = (y: number, m: number, d: number) => {
  const s = `${y}-${pad(m)}-${pad(d)}`;
  return isIsoDate(s) ? s : null;
};

/**
 * Dates the way Indian gyms write them: 15/10/2026, 15-10-26, 15.10.2026, 15 Oct 2026, 15-Oct-26,
 * Oct 15 2026, 2026-10-15, and Excel's serial numbers. Day comes first unless that's impossible.
 */
export function parseDate(raw: string): string | null {
  const s = raw.trim().replace(/\s+00:00(:00)?$/, "").replace(/T.*$/, "");
  if (!s) return null;
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const n = Math.floor(Number(s));
    if (n < 20000 || n > 80000) return null; // 1954–2119
    return addDays("1899-12-30", n);
  }
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (m) {
    const [a, b, y] = [Number(m[1]), Number(m[2]), year(m[3])];
    return b > 12 && a <= 12 ? iso(y, a, b) : iso(y, b, a);
  }
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-/.,]+([a-z]{3,9})[\s\-/.,]+(\d{2}|\d{4})$/i);
  if (m) {
    const mon = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    return mon < 0 ? null : iso(year(m[3]), mon + 1, Number(m[1]));
  }
  m = s.match(/^([a-z]{3,9})[\s\-/.]+(\d{1,2})(?:st|nd|rd|th)?,?[\s\-/.]+(\d{2}|\d{4})$/i);
  if (m) {
    const mon = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    return mon < 0 ? null : iso(year(m[3]), mon + 1, Number(m[2]));
  }
  return null;
}

/** 10-digit Indian mobile, from "98765 43210", "+91-9876543210", "09876543210" or 9876543210. */
export function parsePhone(raw: string): string | null {
  if (/e\+?\d+$/i.test(raw.trim())) return null; // 9.88E+09: Excel lost the digits
  const digits = raw.replace(/\.0+$/, "").replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

const clean = (s: string | undefined, max: number) => (s ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** Reads every data row. Rows with nothing in them are skipped silently. */
export function toCandidates(rows: string[][], today: string): { mapping: Mapping; candidates: Candidate[]; errors: RowError[] } | string {
  const head = findHeader(rows);
  if (!head) return "Couldn't find the header row. The first row should have column names such as Name, Mobile, Plan, Start date and End date.";
  const { index, mapping } = head;
  if (!mapping.end && !(mapping.start && (mapping.duration || mapping.plan))) {
    return "Add an End date / Expiry column (or a Start date with a Duration like \"3 months\") so the right members get renewal reminders.";
  }
  const data = rows.slice(index + 1);
  if (data.length > MAX_ROWS) return `The file has ${data.length} rows. Import at most ${MAX_ROWS} at a time.`;
  const at = (r: string[], f: Field) => (mapping[f] ? (r[mapping[f]!.column] ?? "") : "");
  const candidates: Candidate[] = [];
  const errors: RowError[] = [];
  data.forEach((r, i) => {
    const row = index + i + 2; // 1-based, as the spreadsheet shows it
    if (!r.some((c) => c && c.trim())) return;
    const name = clean(at(r, "name"), 80);
    const rawPhone = at(r, "phone");
    const phone = parsePhone(rawPhone);
    const emailRaw = clean(at(r, "email"), 120);
    const email = emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw.toLowerCase() : null;
    const durationText = clean(at(r, "duration"), 40);
    const planText = clean(at(r, "plan"), 80);
    const span = parseDuration(/^\d+$/.test(durationText) ? `${durationText} months` : durationText) ?? parseDuration(planText);
    let startOn = mapping.start ? parseDate(at(r, "start")) : null;
    let expiresOn = mapping.end ? parseDate(at(r, "end")) : null;
    if (!expiresOn && startOn && span) expiresOn = expiryFor(startOn, span);
    if (name.length < 2) return void errors.push({ row, message: "Name is missing." });
    if (!phone) return void errors.push({ row, message: /e\+?\d+$/i.test(rawPhone.trim()) ? `Mobile shows as ${rawPhone.trim()}: format that column as Text in Excel and export again.` : `"${rawPhone.trim() || "blank"}" isn't a 10-digit mobile number.` });
    if (!expiresOn) return void errors.push({ row, message: at(r, "end").trim() ? `Couldn't read the end date "${at(r, "end").trim()}". Use a format like 15/10/2026.` : "End date is missing." });
    if (!startOn) startOn = expiresOn < today ? expiresOn : today; // unknown start: only the end date drives reminders
    if (expiresOn < startOn) return void errors.push({ row, message: "End date is before the start date." });
    candidates.push({ row, name, phone, email, planName: planText || durationText || "Membership", startOn, expiresOn, notes: clean(at(r, "notes"), 1000) });
  });
  return { mapping, candidates, errors };
}
