import ToolLayout from "@/components/tools/ToolLayout";

const FEATURES = [
    { icon: "🌅", title: "Lagna & bhavas", text: "Ascendant and whole-sign houses from spherical trigonometry and true sidereal time." },
    { icon: "🪐", title: "All nine grahas", text: "Sun through Saturn from VSOP87D planetary theory, Moon from lunar theory, Rahu/Ketu mean node — with retrograde and combustion flags." },
    { icon: "🔷", title: "D-1 & D-9 charts", text: "Rashi and navamsha charts in both North and South Indian styles." },
    { icon: "📅", title: "Full panchanga", text: "Tithi, vara, nakshatra, yoga and karana with exact end times found by root-finding, plus sunrise and sunset." },
    { icon: "⏳", title: "Vimshottari dasha", text: "The complete 120-year cycle: mahadasha, antardasha and pratyantardasha with the running period highlighted." },
    { icon: "💪", title: "Strengths", text: "Ashtakavarga (SAV + per-graha bindus), uccha and cheshta bala, and the Parashari aspect grid." },
];

export default function VedicBirthChart() {
    return (
        <ToolLayout
            title="Vedic Birth Chart"
            description="Cast an accurate kundli from your birth details — computed from real astronomy, not lookup tables."
        >
            <div className="space-y-8">
                {/* Launcher */}
                <div className="card p-8 text-center border-2 border-primary/40">
                    <div className="text-5xl mb-4">🪔</div>
                    <h2 className="text-2xl font-bold mb-2">Jyotisha Engine</h2>
                    <p className="text-muted max-w-xl mx-auto mb-6">
                        Enter a name, date, time and place of birth — get the full kundli: lagna, planetary
                        positions with nakshatras, panchanga, dashas and strength tables. Everything runs in
                        your browser; nothing is uploaded or stored.
                    </p>
                    <a
                        href="/jyotish.html"
                        className="inline-block bg-primary text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity text-lg"
                    >
                        Open the Birth Chart Calculator →
                    </a>
                    <p className="text-sm text-muted mt-4">
                        Opens as a full-page app. Free, no signup, works offline once loaded.
                    </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="card p-5">
                            <div className="text-2xl mb-2">{f.icon}</div>
                            <h3 className="font-bold mb-1">{f.title}</h3>
                            <p className="text-sm text-muted">{f.text}</p>
                        </div>
                    ))}
                </div>

                {/* Accuracy */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-3">How accurate is it?</h2>
                    <p className="text-muted mb-3">
                        Positions are computed from first principles — Kepler&apos;s equation, VSOP87D
                        perturbation series, lunar theory and IAU precession with the Lahiri (Chitra-paksha)
                        ayanamsa — then validated against NASA JPL&apos;s DE421 ephemeris across 1,200 test
                        epochs from 1900 to 2050.
                    </p>
                    <ul className="text-sm text-muted space-y-1 list-disc pl-5">
                        <li>Sun and planets: within 0.02 arc-minutes of JPL (about 1/40,000 of a zodiac sign)</li>
                        <li>Moon: within 0.22 arc-minutes — 1/900 of one nakshatra pada</li>
                        <li>Sunrise and panchanga boundaries: within seconds of the astronomical almanac</li>
                        <li>Supported birth dates: 1800–2149</li>
                    </ul>
                    <p className="text-sm text-muted mt-3">
                        A one-minute error in the recorded birth time shifts the lagna more than the
                        ephemeris ever will — so the practical accuracy of your chart depends mostly on how
                        precisely the birth time is known.
                    </p>
                </div>

                {/* What you need */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-3">What you&apos;ll need</h2>
                    <ul className="text-sm text-muted space-y-1 list-disc pl-5">
                        <li><strong className="text-foreground">Date of birth</strong> — any date from 1800 to 2149</li>
                        <li><strong className="text-foreground">Time of birth</strong> — or tick &ldquo;time unknown&rdquo; to cast a sunrise chart</li>
                        <li><strong className="text-foreground">Place of birth</strong> — pick from 280+ cities or enter coordinates directly</li>
                        <li><strong className="text-foreground">Name (optional)</strong> — checked against the traditional nakshatra naming syllables</li>
                    </ul>
                </div>
            </div>
        </ToolLayout>
    );
}
