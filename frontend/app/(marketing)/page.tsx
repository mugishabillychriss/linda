import Link from "next/link";
import Gauge from "../../components/ui/Gauge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

const steps = [
  {
    n: "01",
    title: "Upload",
    body: "Drop in a CSV, Excel, or JSON file. Nothing is modified until you say so.",
  },
  {
    n: "02",
    title: "Diagnose",
    body: "Get a plain-language quality report: what's wrong, why it matters, what to fix.",
  },
  {
    n: "03",
    title: "Clean",
    body: "Approve the recommended fixes, preview the result, download an AI-ready dataset.",
  },
];

const features = [
  { title: "Never touches the original", body: "Every cleaning action writes a new file. Your source data is never overwritten." },
  { title: "Explained, not just flagged", body: "Every issue comes with why it matters and what fixing it changes." },
  { title: "Built for ML workflows", body: "Designed for the datasets that feed models, not spreadsheets for finance teams." },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-signal mb-4">
            AI Data Preparation
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-5">
            Prepare your data for AI in minutes.
          </h1>
          <p className="text-slate text-lg mb-8 max-w-md">
            Upload a messy dataset. Get a plain-language diagnosis of what&apos;s wrong with it.
            Approve the fixes. Download something a model can actually learn from.
          </p>
          <div className="flex gap-3">
            <Link href="/signup">
              <Button>Get started free</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
          </div>
        </div>
        <Card className="p-8 flex flex-col items-center">
          <Gauge score={94} label="quality score" size={220} />
          <p className="text-sm text-slate mt-2">from 61 after cleaning</p>
        </Card>
      </section>

      {/* Process */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-ink/10">
        <h2 className="font-display text-2xl font-semibold mb-10">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-sm text-signal">{s.n}</span>
              <h3 className="font-display text-xl font-semibold mt-2 mb-2">{s.title}</h3>
              <p className="text-slate text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-ink/10">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title}>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-slate text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-ink/10 text-center">
        <h2 className="font-display text-3xl font-semibold mb-6">
          Stop spending 80% of your project on data cleanup.
        </h2>
        <Link href="/signup">
          <Button>Get started free</Button>
        </Link>
      </section>
    </main>
  );
}
