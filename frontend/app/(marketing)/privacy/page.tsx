import MarketingNav from "../../../components/MarketingNav";
import MarketingFooter from "../../../components/MarketingFooter";

export default function PrivacyPage() {
  return (
    <main>
      <MarketingNav />
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-slate text-sm mb-10">Last updated July 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-ink/90">
          <p>
            This describes what we collect and how it&apos;s used. As a beta product, this
            policy will be expanded as we grow -- this is a starting point, not a final legal
            document.
          </p>
          <div>
            <h2 className="font-semibold mb-2">What we collect</h2>
            <p>
              Your email address (for your account), and the datasets you upload (to analyze
              and clean them). We don&apos;t collect more than what&apos;s needed to run the
              service.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">How your data is used</h2>
            <p>
              Uploaded datasets are sent to our AI provider (Groq) to generate a diagnosis, and
              stored in our database (Supabase) so you can access your history. We don&apos;t
              use your data to train any models, and don&apos;t sell or share it with third
              parties.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Where your data lives</h2>
            <p>
              Datasets and account data are stored with Supabase. Diagnosis requests are
              processed by Groq. Both are third-party infrastructure providers bound by their
              own security practices.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Your control over your data</h2>
            <p>
              You can delete any dataset at any time from your dashboard, and delete your
              account entirely by contacting us.
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Contact</h2>
            <p>Questions about this policy? Reach out through the contact link in the footer.</p>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
