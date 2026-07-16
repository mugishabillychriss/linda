import Link from "next/link";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import MarketingNav from "../../../components/MarketingNav";
import MarketingFooter from "../../../components/MarketingFooter";

const plans = [
  {
    name: "Free trial",
    price: "$0",
    period: "for 14 days",
    description: "Everything, so you can see real results on your own data first.",
    features: [
      "Full diagnosis engine, all 6 quality dimensions",
      "Up to 5 datasets",
      "Files up to 10,000 rows",
      "All 8 cleaning operations",
      "Preview and approve every change",
    ],
    cta: "Start free trial",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For individuals working with real datasets on a regular basis.",
    features: [
      "Everything in the free trial",
      "Unlimited datasets",
      "Files up to 250,000 rows",
      "Priority processing",
      "Full upload history",
      "Email support",
    ],
    cta: "Start free trial",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "per month",
    description: "For teams that need to share work and standardize how data gets cleaned.",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared dataset history",
      "Files up to 1,000,000 rows",
      "Priority support",
    ],
    cta: "Talk to us",
    href: "/signup",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main>
      <MarketingNav />

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal mb-4">Pricing</p>
        <h1 className="font-display text-4xl font-semibold mb-4">
          Start free. Upgrade when your datasets do.
        </h1>
        <p className="text-slate max-w-lg mx-auto">
          Every plan runs the same diagnosis and cleaning engine. What changes is how
          much data you can put through it.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 flex flex-col ${
                plan.highlighted ? "border-signal ring-1 ring-signal" : ""
              }`}
            >
              {plan.highlighted && (
                <span className="font-mono text-[10px] uppercase tracking-wide text-signal mb-3">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-xl font-semibold mb-1">{plan.name}</h2>
              <p className="text-slate text-sm mb-5">{plan.description}</p>
              <div className="mb-6">
                <span className="font-display text-3xl font-semibold">{plan.price}</span>
                <span className="text-slate text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm flex gap-2">
                    <span className="text-signal">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button variant={plan.highlighted ? "primary" : "secondary"} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
        <p className="text-center text-slate text-sm mt-10">
          Every plan includes a 14-day free trial. No credit card required to start.
        </p>
      </section>

      <MarketingFooter />
    </main>
  );
}
