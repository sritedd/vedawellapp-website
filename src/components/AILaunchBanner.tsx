import Link from "next/link";

export default function AILaunchBanner() {
    return (
        <section className="border-b border-cyan-200/60 bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-cyan-950/60 dark:to-indigo-950/40 dark:border-cyan-900/40">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-200">
                        <span className="font-extrabold text-cyan-700 dark:text-cyan-300">New: Guardian AI is live.</span>{" "}
                        Get AI defect descriptions, stage-specific advice, builder checks, and a construction chat copilot.
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/guardian"
                            className="inline-flex items-center rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors"
                        >
                            Try AI Features
                        </Link>
                        <Link
                            href="/blog"
                            className="inline-flex items-center rounded-md border border-cyan-300 dark:border-cyan-700 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100/70 dark:hover:bg-cyan-900/40 transition-colors"
                        >
                            Read AI Update
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
