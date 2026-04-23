import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AILaunchBanner from "@/components/AILaunchBanner";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import GlobalAdSlot from "@/components/GlobalAdSlots";
import ThemeProvider from "@/components/ThemeProvider";
import CookieConsent from "@/components/CookieConsent";
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
    "90+ free online tools (PDF, image, calculator, developer), 19 browser games, and HomeOwner Guardian — the AI-powered construction tracker protecting Australian home builds. No sign-up required.",
  keywords:
    "free online tools, productivity tools, games, BMI calculator, home construction tracker, Australian building, defect tracking",
  metadataBase: new URL("https://vedawellapp.com"),
  openGraph: {
    title: "VedaWell Tools - 90+ Free Online Tools & Games",
    description:
      "Free browser-based productivity tools, games, and the HomeOwner Guardian for Australian home construction.",
    url: "https://vedawellapp.com",
    siteName: "VedaWell Tools",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "VedaWell Tools Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VedaWell Tools",
    description: "90+ free online tools, games, and HomeOwner Guardian.",
    images: ["/og-default.png"],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0D6E6E" },
  ],
};

// Analytics IDs from env vars (prevents staging/dev polluting production analytics)
const ADSENSE_PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";
const GA4_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* WebSite Schema.org — enables sitelinks search box in Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "VedaWell Tools",
              url: "https://vedawellapp.com",
              description: "90+ free browser-based tools for productivity, development, and creativity.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://vedawellapp.com/tools?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Organization Schema with hasPart for sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "VedaWell",
              alternateName: "HomeOwner Guardian",
              url: "https://vedawellapp.com",
              logo: "https://vedawellapp.com/icon-512.png",
              description: "VedaWell builds free online productivity tools and HomeOwner Guardian, the AI-powered construction tracker for Australian homeowners.",
              foundingDate: "2026",
              areaServed: { "@type": "Country", name: "Australia" },
              contactPoint: { "@type": "ContactPoint", email: "support@vedawellapp.com", contactType: "customer support" },
              sameAs: ["https://ko-fi.com/vedawell", "https://buymeacoffee.com/vedawell"],
              hasPart: [
                { "@type": "WebApplication", name: "HomeOwner Guardian", url: "https://vedawellapp.com/guardian", description: "AI-powered construction tracker for Australian homeowners" },
                { "@type": "CollectionPage", name: "Free Online Tools", url: "https://vedawellapp.com/tools", description: "90+ free browser-based productivity tools" },
                { "@type": "CollectionPage", name: "Browser Games", url: "https://vedawellapp.com/games", description: "19 free browser games" },
                { "@type": "Blog", name: "VedaWell Blog", url: "https://vedawellapp.com/blog", description: "Home building tips and tool guides" },
                { "@type": "WebPage", name: "About VedaWell", url: "https://vedawellapp.com/about", description: "About VedaWell and HomeOwner Guardian" },
              ],
            }),
          }}
        />
        {/* SiteNavigationElement — primary signal for Google sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                { "@type": "SiteNavigationElement", name: "HomeOwner Guardian", url: "https://vedawellapp.com/guardian", description: "AI-powered home construction tracker for Australian homeowners" },
                { "@type": "SiteNavigationElement", name: "Free Tools", url: "https://vedawellapp.com/tools", description: "90+ free browser-based productivity, developer, and SEO tools" },
                { "@type": "SiteNavigationElement", name: "Browser Games", url: "https://vedawellapp.com/games", description: "19 free browser games including chess, sudoku, and 2048" },
                { "@type": "SiteNavigationElement", name: "Blog", url: "https://vedawellapp.com/blog", description: "Home building tips, tool guides, and Guardian updates" },
                { "@type": "SiteNavigationElement", name: "Pricing", url: "https://vedawellapp.com/guardian/pricing", description: "Free and Pro plans for HomeOwner Guardian" },
                { "@type": "SiteNavigationElement", name: "About", url: "https://vedawellapp.com/about", description: "About VedaWell — free tools and HomeOwner Guardian" },
              ],
            }),
          }}
        />
        {/* Google Consent Mode v2 — must load BEFORE any Google tags */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                wait_for_update: 500,
              });
            `,
          }}
        />
        {/* Theme flash prevention — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vedawell-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        {/* RSS feed discovery */}
        <link rel="alternate" type="application/rss+xml" title="VedaWell Blog" href="/feed.xml" />
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
        {/* Skip to main content link for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <AILaunchBanner />
            <GlobalAdSlot position="top" />
            <main id="main-content" role="main" className="flex-1">{children}</main>
            <GlobalAdSlot position="bottom" />
            <Footer />
            <InstallPrompt />
            <CookieConsent />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
