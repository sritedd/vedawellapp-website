import type { Metadata } from "next";
import PanchangClient from "./PanchangClient";

export const metadata: Metadata = {
    title: "Hindu Panchang Today — Tithi, Nakshatra, Rahu Kaal & Auspicious Timings",
    description:
        "Free daily Hindu Panchang with accurate Tithi, Nakshatra, Yoga, Karana, Rahu Kaal, Yamaganda, and Gulika timings. Calculated in your browser for any date and location.",
    keywords:
        "hindu panchang, daily panchang, tithi today, nakshatra today, rahu kaal, yamaganda, gulika, auspicious time, vedic calendar, panchangam, hindu calendar",
    openGraph: {
        title: "Hindu Panchang Today — Tithi, Nakshatra & Auspicious Timings",
        description:
            "Free daily Panchang with Tithi, Nakshatra, Yoga, Karana, Rahu Kaal and auspicious timings.",
        url: "https://vedawellapp.com/panchang",
    },
    alternates: {
        canonical: "https://vedawellapp.com/panchang",
    },
};

export default function PanchangPage() {
    return <PanchangClient />;
}
