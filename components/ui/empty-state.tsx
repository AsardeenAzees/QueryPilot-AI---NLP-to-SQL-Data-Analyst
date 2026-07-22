import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <Card className="border-dashed px-5 py-9 text-center sm:py-11">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[var(--surface-muted)] text-[var(--text-subtle)]"><Icon className="size-5" aria-hidden="true" /></span>
      <p className="mt-4 text-sm font-bold text-[var(--text)]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-[var(--text-muted)]">{description}</p>
    </Card>
  );
}
