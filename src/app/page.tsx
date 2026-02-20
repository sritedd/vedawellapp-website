import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Free &amp; Open Source Tools
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Productivity tools that{" "}
            <span className="text-primary">just work</span>
          </h1>

          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            90+ free, browser-based tools and games to boost your productivity.
            Plus the <strong>HomeOwner Guardian</strong> - your protection system for Australian home construction.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="/tools" className="btn-primary">
              🧰 Explore Tools
            </Link>
            <Link href="/games" className="btn-secondary">
              🎮 Play Games
            </Link>
            <Link href="/guardian" className="btn-primary bg-success hover:bg-success/90">
              🏠 HomeOwner Guardian
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">90+</div>
              <div className="text-muted">Free Tools</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">7</div>
              <div className="text-muted">Fun Games</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-muted">Browser-Based</div>
            </div>
          </div>
        </div>
      </section>

      {/* HomeOwner Guardian Feature Card */}
      <AdBanner slot="1696472735" format="horizontal" className="mb-12 mt-12" />
      <section className="py-16 px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto">
          <div className="card border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🏠</span>
              <div>
                <h2 className="text-2xl font-bold">HomeOwner Guardian</h2>
                <p className="text-muted">Protect your home construction investment</p>
              </div>
            </div>

            <p className="text-muted mb-6">
              Building a home in Australia? Our comprehensive tracking system helps you:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-success">✓</span>
                <span>Pre-plasterboard checklist (catch missing insulation)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-success">✓</span>
                <span>Variation cost tracking (stop cost blowouts)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-success">✓</span>
                <span>Certification gates (no cert = no payment)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-success">✓</span>
                <span>Defect documentation (legal-ready evidence)</span>
              </div>
            </div>

            <Link href="/guardian" className="btn-primary inline-flex items-center gap-2">
              Get Started <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Panchang Feature Card */}
      <AdBanner slot="9056088001" format="horizontal" className="mb-12 mt-12" />
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🕉️</span>
              <div>
                <h2 className="text-2xl font-bold">Hindu Panchang</h2>
                <p className="text-muted">Daily Vedic calendar with astronomical calculations</p>
              </div>
            </div>
            <p className="text-muted mb-6">
              Get accurate Tithi, Nakshatra, Yoga, Karana, Rahu Kaal, and auspicious timings — all calculated right in your browser.
            </p>
            <Link href="/panchang" className="btn-primary inline-flex items-center gap-2">
              View Panchang <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
