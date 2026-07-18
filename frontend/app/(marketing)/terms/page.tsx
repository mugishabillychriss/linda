import MarketingNav from "../../../components/MarketingNav";
import MarketingFooter from "../../../components/MarketingFooter";

export default function TermsPage() {
  return (
    <main>
      <MarketingNav />
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-slate text-sm mb-10">Last updated July 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-ink/90">
          <p>
            Doctor Linda is currently in beta. By using it, you agree to the following terms.
            We&apos;ll update this page as the product matures -- this is a starting point, not
            a final legal document.
          </p>
          <div>
            <h2 className="font-semibold mb-2">The service</h2>
            <p>
              Doctor Linda analyzes datasets you upload and helps you clean them. We don&apos;t
              guarantee the accuracy of any diagnosis or recommendation -- you&apos;re
              responsible for reviewing changes before relying on the output.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Your data</h2>
            <p>
              You retain all rights to any dataset you upload. We store it only to provide the
              service to you, and don&apos;t use it to train models or share it with third
              parties.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Beta status</h2>
            <p>
              As a beta product, features may change, and occasional downtime or bugs are
              possible. We&apos;ll do our best to keep your data safe and accessible regardless.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Account termination</h2>
            <p>
              You can stop using the service and delete your account at any time. We may
              suspend accounts that abuse the service or violate these terms.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Contact</h2>
            <p>Questions about these terms? Reach out through the contact link in the footer.</p>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
