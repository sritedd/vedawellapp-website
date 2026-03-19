import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Panchang — Coming Soon | VedaWell",
    description: "We're rebuilding our Panchang with accurate astronomical calculations. Check back soon.",
    robots: { index: false, follow: false },
};

export default function PanchangPage() {
    return (
        <div className="py-20 px-6 text-center">
            <div className="max-w-md mx-auto">
                <p className="text-5xl mb-6">🔭</p>
                <h1 className="text-2xl font-bold mb-3">Panchang — Coming Soon</h1>
                <p className="text-muted mb-8">
                    We&apos;re rebuilding our Panchang with accurate astronomical calculations.
                    Check back soon for precise Tithi, Nakshatra, Rahu Kaal, and auspicious timings.
                </p>
                <Link href="/" className="btn-primary inline-block">
                    Back to VedaWell
                </Link>
            </div>
        </div>
    );
}
