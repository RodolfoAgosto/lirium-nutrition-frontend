// Calendar days travel as "YYYY-MM-DD" strings, the same shape the API uses.
// They are built from the local date parts on purpose: toISOString() converts to UTC
// and would show tomorrow's date in the evening for a patient in Argentina.

export function toIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDay(iso: string, days: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

// "Saturday, October 10, 2026"
export function formatDay(iso: string): string {
  return parse(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
