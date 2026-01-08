import Link from "next/link";

export default function GuardianPage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-muted hover:text-foreground">Home</Link>
                        <Link href="/tools" className="text-muted hover:text-foreground">Tools</Link>
                        <Link href="/games" className="text-muted hover:text-foreground">Games</Link>
                        <Link href="/panchang" className="text-muted hover:text-foreground">Panchang</Link>
                        <Link href="/guardian" className="font-semibold text-primary">
                            🏠 Guardian
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Guardian Hero */}
            <main className="flex-1 bg-gradient-to-b from-primary/5 to-background">
                <section className="py-16 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <span className="text-6xl mb-4 block">🏠</span>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                            HomeOwner Guardian
                        </h1>
                        <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
                            Your comprehensive protection system for Australian home construction.
                            Stop dodgy builders from missing insulation and racking up variations.
                        </p>
                    </div>
                </section>

                {/* Login CTA */}
                <section className="py-12 px-6">
                    <div className="max-w-lg mx-auto">
                        <div className="card text-center">
                            <h2 className="text-2xl font-bold mb-4">Sign in to get started</h2>
                            <p className="text-muted mb-6">
                                Create a free account to track your construction project with our comprehensive tools.
                            </p>

                            <div className="space-y-4">
                                <Link
                                    href="/guardian/login"
                                    className="btn-primary w-full block text-center"
                                >
                                    Sign In / Sign Up
                                </Link>
                            </div>

                            <p className="text-sm text-muted mt-6">
                                By signing in, you agree to our terms of service and privacy policy.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-16 px-6">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-12">What you'll get</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="card">
                                <span className="text-3xl mb-3 block">📋</span>
                                <h3 className="font-bold mb-2">Pre-Drywall Checklist</h3>
                                <p className="text-muted text-sm">
                                    Mandatory photo proof of ceiling batts, insulation, and electrical rough-in before plasterboard goes up.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">💰</span>
                                <h3 className="font-bold mb-2">Variation Lockbox</h3>
                                <p className="text-muted text-sm">
                                    Digital signatures required BEFORE any variation work begins. Track cumulative variation costs.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">🔒</span>
                                <h3 className="font-bold mb-2">Certification Gates</h3>
                                <p className="text-muted text-sm">
                                    Payment milestones blocked until EICC, plumbing certs, and other compliance docs are uploaded.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">📸</span>
                                <h3 className="font-bold mb-2">Defect Evidence</h3>
                                <p className="text-muted text-sm">
                                    Immutable, timestamped defect records with photos. Legal-ready for Fair Trading or NCAT.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">🛡️</span>
                                <h3 className="font-bold mb-2">License Monitor</h3>
                                <p className="text-muted text-sm">
                                    Track builder license status and insurance expiry. Get alerts 30 days before lapse.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">📊</span>
                                <h3 className="font-bold mb-2">Progress Dashboard</h3>
                                <p className="text-muted text-sm">
                                    Visual overview of payments, inspections, and milestones. Know exactly where you stand.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-8 px-6 text-center text-muted">
                <p>© 2026 VedaWell Tools. Free & Open Source.</p>
            </footer>
        </div>
    );
}
