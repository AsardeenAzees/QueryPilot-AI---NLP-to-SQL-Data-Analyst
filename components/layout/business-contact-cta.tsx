import { ArrowUpRight, Bot, BriefcaseBusiness, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const email = "azeesasardeen@gmail.com";
const portfolioUrl = "https://azeesasardeen.github.io/asardeen-portfolio/";

export function BusinessContactCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8" aria-labelledby="contact-cta-heading">
      <Card className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-y-0 left-0 w-1 bg-[var(--accent)]" aria-hidden="true" />
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div className="max-w-3xl">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]"><Bot className="size-5" aria-hidden="true" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-[var(--accent-strong)]">Build with AI</p>
            <h2 id="contact-cta-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">Need an AI Data Agent for Your Business?</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-muted)] sm:text-base">QueryPilot AI demonstrates how natural-language interfaces can help businesses explore structured data securely and efficiently. For custom AI agents, NLP-to-SQL systems, workflow automation, or business data solutions, contact me to discuss your requirements.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
            <a href={`mailto:${email}`} aria-label="Email Asardeen Azees" className={cn(buttonVariants({ size: "lg" }), "w-full whitespace-nowrap sm:w-auto")}>
              <Mail className="size-4" aria-hidden="true" />Contact Asardeen
            </a>
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" aria-label="Visit Asardeen Azees portfolio in a new tab" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full whitespace-nowrap sm:w-auto")}>
              <BriefcaseBusiness className="size-4" aria-hidden="true" />View Portfolio<ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </Card>
    </section>
  );
}
