import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/siteConfig";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: {
    title: string;
    body: string;
  }[];
};

export function InfoPage({ eyebrow, title, description, sections }: InfoPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 pt-28 pb-20">
      <section className="container mx-auto px-4">
        <div className="rounded-[2rem] bg-white border border-slate-100 p-8 md:p-12 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">{eyebrow}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 mb-4">{title}</h1>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">{description}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 mt-10">
        <div className="grid gap-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-3xl bg-white border border-slate-100 p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{section.title}</h2>
              <p className="text-slate-600 leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-8 text-slate-950 shadow-sm md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="text-2xl font-bold">Need help from {siteConfig.brandName}?</h2>
            <p className="mt-1 text-slate-600">Our team can answer your questions and guide your next step.</p>
          </div>
          <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
            <Link href="/contact">
              Contact Us
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
