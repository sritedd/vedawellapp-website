import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VedaWell Tools - 90+ Free Online Tools, Games & HomeOwner Guardian",
    template: "%s | VedaWell Tools",
  },
  description:
    "90+ free browser-based tools for productivity, development, and wellness. Play classic games. Track your Australian home construction with HomeOwner Guardian.",
  keywords:
    "free online tools, productivity tools, games, BMI calculator, panchang, home construction tracker, Australian building, defect tracking",
  metadataBase: new URL("https://vedawellapp.com"),
  openGraph: {
    title: "VedaWell Tools - 90+ Free Online Tools & Games",
    description:
      "Free browser-based productivity tools, games, and the HomeOwner Guardian for Australian home construction.",
    url: "https://vedawellapp.com",
    siteName: "VedaWell Tools",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VedaWell Tools",
    description: "90+ free online tools, games, and HomeOwner Guardian.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ============================================================
// TODO: Replace these IDs before deploying to production
// AdSense publisher ID: https://adsense.google.com → Account → Publisher ID
// GA4 Measurement ID:   https://analytics.google.com → Admin → Data Streams
// ============================================================
const ADSENSE_PUB_ID = "ca-pub-3026726001538425"; // Your AdSense publisher ID
const GA4_ID = "G-HCMFZFC0D7";                    // Your GA4 Measurement ID

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
          `}
        </Script>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
