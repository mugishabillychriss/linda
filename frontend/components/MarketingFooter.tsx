import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-ink/10 flex flex-col md:flex-row justify-between items-center gap-4">
      <span className="font-display font-semibold">Doctor Linda</span>
      <div className="flex gap-6 text-sm text-slate">
        <Link href="/#how-it-works" className="hover:text-ink transition-colors">
          How it works
        </Link>
        <Link href="/pricing" className="hover:text-ink transition-colors">
          Pricing
        </Link>
        <Link href="/docs" className="hover:text-ink transition-colors">
          Docs
        </Link>
        <Link href="/terms" className="hover:text-ink transition-colors">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-ink transition-colors">
          Privacy
        </Link>
      </div>
      <span className="text-xs text-slate font-mono">© 2026 Doctor Linda</span>
    </footer>
  );
}
