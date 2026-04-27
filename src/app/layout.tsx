import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Analytics } from "@vercel/analytics/react";
import { getTelegramUrl } from "@/lib/telegram";

export const metadata: Metadata = {
  metadataBase: new URL("https://dhabaroute.com"),
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched server-side so the client Header component can receive it
  // as a prop without needing its own async fetch.
  const telegramUrl = await getTelegramUrl();

  return (
    <html lang="en">
      <head>
        {/* Bricolage Grotesque (display/headings) + DM Sans (UI/body)
            + Space Grotesk (logo wordmark only — header + footer) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:text-paper focus:px-3 focus:py-2 focus:rounded-md"
        >
          Skip to content
        </a>
        <Header telegramUrl={telegramUrl} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <FeedbackButton />
        <Analytics />
      </body>
    </html>
  );
}
