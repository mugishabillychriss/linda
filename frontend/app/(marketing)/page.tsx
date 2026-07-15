import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Doctor Linda</h1>
      <p className="text-lg text-gray-600 mb-8">Prepare your data for AI in minutes.</p>
      <div className="flex gap-4">
        <Link href="/signup" className="bg-black text-white rounded px-6 py-3">
          Get started
        </Link>
        <Link href="/login" className="border rounded px-6 py-3">
          Log in
        </Link>
      </div>
    </main>
  );
}
