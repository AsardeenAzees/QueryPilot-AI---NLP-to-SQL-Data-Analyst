import { ArrowUpRight, BriefcaseBusiness, Github, Linkedin, Mail, UserRound } from "lucide-react";

const externalLinks = [
  { label: "Portfolio", href: "https://azeesasardeen.github.io/asardeen-portfolio/", icon: BriefcaseBusiness },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/asardeen-azees/", icon: Linkedin },
  { label: "GitHub", href: "https://github.com/AsardeenAzees", icon: Github },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]" aria-label="Creator and project information">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.8fr)] lg:gap-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]"><UserRound className="size-4.5" aria-hidden="true" /></span>
              <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--text-subtle)]">Created by</p><p className="mt-0.5 font-extrabold text-[var(--text)]">Asardeen Azees</p></div>
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">QueryPilot AI — A secure natural-language data analysis and NLP-to-SQL portfolio project.</p>
            <a href="mailto:azeesasardeen@gmail.com" aria-label="Email Asardeen Azees at azeesasardeen@gmail.com" className="focus-ring mt-4 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-[var(--accent-strong)] hover:underline">
              <Mail className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">azeesasardeen@gmail.com</span>
            </a>
          </div>

          <nav aria-label="Creator links">
            <h2 className="text-sm font-extrabold text-[var(--text)]">Connect</h2>
            <div className="mt-3 grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {externalLinks.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — opens in a new tab`} className="focus-ring group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]">
                  <Icon className="size-4 text-[var(--text-subtle)] group-hover:text-[var(--accent)]" aria-hidden="true" />
                  <span>{label}</span><ArrowUpRight className="ml-auto size-3.5 text-[var(--text-subtle)]" aria-hidden="true" />
                </a>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-[var(--border)] pt-6 text-xs leading-5 text-[var(--text-subtle)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Asardeen Azees. All rights reserved.</p>
          <p>Built as a secure AI and data engineering portfolio project.</p>
        </div>
      </div>
    </footer>
  );
}
