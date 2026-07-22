"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Laptop, Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const choices = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
        aria-label="Choose colour theme"
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring grid size-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-sm transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
      >
        <SunMoon className="size-4.5" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" aria-label="Colour theme" className="absolute right-0 z-50 mt-2 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl shadow-slate-950/10 dark:shadow-black/30">
          {choices.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={(theme ?? "system") === value}
              onClick={() => { setTheme(value); setOpen(false); }}
              className={cn(
                "focus-ring flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition",
                (theme ?? "system") === value ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{label}</span>
              {(theme ?? "system") === value && <Check className="ml-auto size-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
