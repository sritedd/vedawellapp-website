import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TryAIClient from "./TryAIClient";

export const metadata: Metadata = {
    title: "Try the AI Site Supervisor",
    description: "Describe anything you've noticed on your build site. Guardian's AI suggests severity, related red flags, and what to do next. Free preview, no project required.",
};

export default async function TryAIPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/guardian/login?returnTo=/guardian/try-ai");
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-10 md:py-16">
                <div className="mb-6">
                    <Link href="/guardian/dashboard" className="text-sm text-muted hover:text-foreground">
                        ← Back to dashboard
                    </Link>
                </div>

                <header className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                        Free Preview · No Project Needed
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Try the AI Site Supervisor</h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Describe anything you&apos;ve seen on a build site — even a small concern. Guardian&apos;s AI will tell you the severity, the relevant Australian Standard, and exactly what to do next.
                    </p>
                </header>

                <TryAIClient />

                <section className="mt-12 p-6 rounded-2xl bg-card border border-border">
                    <h2 className="text-lg font-bold mb-3">What this is</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                        This is the same AI that powers Guardian&apos;s in-project defect assistant. When you set up your project, every defect you log will be analysed automatically — plus you&apos;ll get stage-specific guidance, contract review, and tribunal-ready PDF exports.
                    </p>
                    <Link
                        href="/guardian/projects/new"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                    >
                        Start your free project →
                    </Link>
                </section>
            </div>
        </div>
    );
}
