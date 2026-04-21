import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://dhabaroute.example"),
  title: {
    default: "DhabaRoute — Authentic dhabas on your route",
    template: "%s · DhabaRoute",
  },
  description:
    "Find authentic dhabas for long-haul drivers and highway travelers. Quick, honest info — so you can eat, rest, and keep moving.",
  openGraph: {
    title: "DhabaRoute",
    description:
      "Authentic dhabas on your route. Built for drivers who don't have time to scroll.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:text-paper focus:px-3 focus:py-2 focus:rounded-md"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
