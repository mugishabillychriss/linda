import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "../components/ui/Toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Doctor Linda",
  description: "Prepare your data for AI in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <head>
        {/* Runs before paint to avoid a light-mode flash for users who
            prefer/saved dark mode. Reads the same localStorage key and
            media query that ThemeToggle uses. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var dark = stored ? stored === 'dark' : prefersDark;
                  if (dark) document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-body bg-paper text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
