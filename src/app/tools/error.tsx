"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Tool-scoped error boundary. Catches uncaught errors in any /tools/*
 * page (e.g. a third-party lib chokes on an unusual input, or a tool
 * crashes during render) and shows a friendly recovery UI instead of the
 * generic Next.js error screen.
 *
 * Per-tool error handling (validation, friendlyError() messages) still
 * catches the common cases inline — this is the safety net for the rest.
 */
export default function ToolsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error("[tools/error] uncaught:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-background">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                    ⚠️
                </div>
                <h1 className="text-2xl font-bold mb-2">This tool hit a snag</h1>
                <p className="text-muted-foreground text-sm mb-6">
                    Something unexpected went wrong. Your data stayed in your browser — nothing was uploaded.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                    >
                        Try again
                    </button>
                    <Link
                        href="/tools"
                        className="px-5 py-2.5 rounded-lg border border-border font-semibold hover:bg-muted/30 transition-colors"
                    >
                        Back to tools
                    </Link>
                </div>

                {error.digest && (
                    <p className="mt-6 text-[11px] text-muted-foreground font-mono">
                        Ref: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
