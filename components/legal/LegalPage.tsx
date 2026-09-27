import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/Headings";
import { LEGAL_LAST_UPDATED } from "@/lib/site";

// Readable long-form layout shared by the Privacy Policy and Terms pages
export default function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <Container className="pt-28 pb-20">
      <article className="mx-auto max-w-3xl">
        <PageHeader title={title} description={`Last updated ${LEGAL_LAST_UPDATED}`} className="mb-6" />
        <div className="text-base leading-relaxed text-fg-soft">{intro}</div>
        <div className="mt-10 space-y-10">{children}</div>
      </article>
    </Container>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-fg">{title}</h2>
      <div className="space-y-3 text-sm sm:text-base leading-relaxed text-fg-soft [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-danger [&_li]:pl-1 [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
