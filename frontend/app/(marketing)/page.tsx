import Link from "next/link";
import Gauge from "../../components/ui/Gauge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";

const steps = [
  {
    n: "01",
    title: "Upload",
    body: "Drop in a CSV, Excel, or JSON file. We read it immediately and nothing is changed until you approve it.",
  },
  {
    n: "02",
    title: "Diagnose",
    body: "Every column gets profiled for missing values, duplicates, outliers, and invalid formats, then scored across seven quality dimensions.",
  },
  {
    n: "03",
    title: "Review & clean",
    body: "See exactly what each fix would change before it happens. Approve the ones you want, skip the ones you don't.",
  },
  {
    n: "04",
    title: "Download",
    body: "Get an AI-ready file back, plus a report showing your quality score before and after.",
  },
];

const dimensions = [
  { name: "Completeness", body: "How much of your data is actually there, column by column." },
  { name: "Validity", body: "Whether values match the format they claim to be -- real emails, real dates, real numbers." },
  { name: "Uniqueness", body: "Duplicate rows and duplicate records that would double-count in an analysis." },
  { name: "Consistency", body: "Mixed casing, stray whitespace, and formatting that varies row to row." },
  { name: "Accuracy", body: "Outliers and impossible values -- a 200-year-old customer, a negative salary." },
  { name: "Integrity", body: "Structural problems like duplicate columns or fields that never vary." },
];

const faqs = [
  {
    q: "Does it change my original file?",
    a: "No. Every cleaning operation writes a new file. Your upload stays exactly as you gave it to us, and you can always go back to it.",
  },
  {
    q: "What file types can I upload?",
    a: "CSV, Excel (.xlsx), and JSON today. We're adding more as we hear what people need.",
  },
  {
    q: "Do I have to accept every recommended fix?",
    a: "No. Each issue we find comes with its own checkbox, so you can approve some and skip others, and preview exactly what a fix would do before you commit to it.",
  },
  {
    q: "What happens when my trial ends?",
    a: "You'll be asked to choose a plan to keep using Doctor Linda. Nothing is deleted, and you can export anything you've already cleaned.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, from your account settings, with no cancellation fee.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <MarketingNav />

      {/* Trial banner */}
      <div className="bg-signal/5 border-y border-signal/10 py-2.5 text-center">
        <p className="text-sm text-signal font-medium">
          14-day free trial. No credit card required.
        </p>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-signal mb-4">
            AI Data Preparation
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-5">
            Prepare your data for AI in minutes.
          </h1>
          <p className="text-slate text-lg mb-8 max-w-md">
            Every AI project starts with a dataset that isn&apos;t ready. Doctor Linda profiles
            it, explains what&apos;s wrong in plain language, and lets you approve each fix
            before anything changes -- so you spend your time building models, not
            wrangling spreadsheets.
          </p>
          <div className="flex gap-3">
            <Link href="/signup">
              <Button>Start free trial</Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary">See how it works</Button>
            </Link>
          </div>
        </div>
        <Card className="p-8 flex flex-col items-center">
          <Gauge score={94} label="quality score" size={220} />
          <p className="text-sm text-slate mt-2">from 61 after cleaning</p>
        </Card>
      </section>

      {/* Process */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16 border-t border-ink/10">
        <h2 className="font-display text-2xl font-semibold mb-2">How it works</h2>
        <p className="text-slate mb-10 max-w-xl">
          Four steps, in this order, every time. Nothing happens automatically that
          you haven&apos;t seen first.
        </p>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-sm text-signal">{s.n}</span>
              <h3 className="font-display text-lg font-semibold mt-2 mb-2">{s.title}</h3>
              <p className="text-slate text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quality dimensions */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-ink/10">
        <h2 className="font-display text-2xl font-semibold mb-2">
          A quality score you can actually break down
        </h2>
        <p className="text-slate mb-10 max-w-xl">
          Instead of one opaque number, every dataset is scored across six
          dimensions, so you know exactly where the problems are.
        </p>
        <div className="grid md:grid-cols-3 gap-x-8 gap-y-8">
          {dimensions.map((d) => (
            <div key={d.name}>
              <h3 className="font-semibold mb-2">{d.name}</h3>
              <p className="text-slate text-sm leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-ink/10 text-center">
        <h2 className="font-display text-2xl font-semibold mb-3">
          Start free. Upgrade when you need to.
        </h2>
        <p className="text-slate mb-8 max-w-lg mx-auto">
          Every plan includes the full diagnosis and cleaning engine. Higher tiers
          add larger files, more uploads, and priority processing.
        </p>
        <Link href="/pricing">
          <Button variant="secondary">See plans and pricing</Button>
        </Link>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-ink/10">
        <h2 className="font-display text-2xl font-semibold mb-10 text-center">
          Questions people ask before starting
        </h2>
        <div className="space-y-8">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold mb-1.5">{f.q}</h3>
              <p className="text-slate text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-ink/10 text-center">
        <h2 className="font-display text-3xl font-semibold mb-3">
          Stop spending 80% of your project on data cleanup.
        </h2>
        <p className="text-slate mb-6">14-day free trial. No credit card required.</p>
        <Link href="/signup">
          <Button>Start free trial</Button>
        </Link>
      </section>

      <MarketingFooter />
    </main>
  );
}
