import Link from "next/link";
import Button from "./ui/Button";

export default function MarketingNav() {
  return (
    <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
      <Link href="/" className="font-display font-semibold text-lg">
        Doctor Linda
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm text-slate">
        <Link href="/#how-it-works" className="hover:text-ink transition-colors">
          How it works
        </Link>
        <Link href="/pricing" className="hover:text-ink transition-colors">
          Pricing
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost">Log in</Button>
        </Link>
        <Link href="/signup">
          <Button>Start free trial</Button>
        </Link>
      </div>
    </nav>
  );
}
