import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { levelCategory, formatLevel, LEVEL_LABELS, type LevelCategory, type PaymentStatus } from "@/lib/padel";

const LEVEL_CLASSES: Record<LevelCategory, string> = {
  iniciacion: "bg-level-beginner/15 text-level-beginner border-level-beginner/30",
  intermedio: "bg-level-intermediate/15 text-level-intermediate border-level-intermediate/30",
  avanzado: "bg-level-advanced/15 text-level-advanced border-level-advanced/30",
};

export function LevelBadge({ level, category, className }: { level?: number; category?: LevelCategory; className?: string }) {
  const cat = category ?? levelCategory(level ?? 1);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        LEVEL_CLASSES[cat],
        className,
      )}
    >
      {LEVEL_LABELS[cat]}
      {level !== undefined && <span className="font-mono opacity-80">{formatLevel(level)}</span>}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const paid = status === "pagado";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        paid ? "border-success/30 bg-success/15 text-success" : "border-warning/30 bg-warning/15 text-warning",
      )}
    >
      <span className={cn("size-1.5 rounded-full", paid ? "bg-success" : "bg-warning")} />
      {paid ? "Pagado" : "Pendiente"}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-5",
        tone === "primary" && "border-primary/40 bg-primary text-primary-foreground glow-lime",
        tone === "warning" && "border-warning/40",
      )}
    >
      <div className="flex items-start justify-between">
        <p className={cn("text-xs font-medium uppercase tracking-wider", tone === "primary" ? "opacity-80" : "text-muted-foreground")}>
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === "primary" ? "bg-primary-foreground/15" : tone === "warning" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{value}</p>
      {hint && <p className={cn("mt-1 text-xs", tone === "primary" ? "opacity-80" : "text-muted-foreground")}>{hint}</p>}
    </div>
  );
}

export function Avatar({ name, src, className }: { name: string; src?: string | undefined; className?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-display text-sm font-bold text-foreground",
        className,
      )}
    >
      {src ? <img src={src} alt={name} className="absolute inset-0 size-full object-cover" /> : initials}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="font-display font-semibold">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
