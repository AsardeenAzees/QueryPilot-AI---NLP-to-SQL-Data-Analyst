import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "success" | "info" | "warning";
  className?: string;
}

export function StatusBadge({ children, icon: Icon, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
      tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300",
      tone === "info" && "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/70 dark:bg-sky-950/50 dark:text-sky-300",
      tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-300",
      tone === "neutral" && "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]",
      className,
    )}>
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}
