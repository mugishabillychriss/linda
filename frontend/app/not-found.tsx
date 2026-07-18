import Link from "next/link";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal mb-3">404</p>
        <h1 className="font-display text-2xl font-semibold mb-3">Page not found</h1>
        <p className="text-slate text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist, or may have moved.
        </p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </Card>
    </main>
  );
}
