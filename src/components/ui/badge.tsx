import { cn } from "@/lib/utils";

const TONES = {
  DRAFT: "bg-accent/20 text-foreground",
  ACTIVE: "bg-primary/10 text-primary",
  INACTIVE: "bg-border text-muted",
} as const;

const LABELS = { DRAFT: "Draft", ACTIVE: "Active", INACTIVE: "Inactive" } as const;

export function StatusBadge({ status }: { status: keyof typeof TONES }) {
  return (
    <span className={cn("inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold", TONES[status])}>
      {LABELS[status]}
    </span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-border bg-background px-2.5 py-0.5 text-sm text-foreground">
      {children}
    </span>
  );
}
