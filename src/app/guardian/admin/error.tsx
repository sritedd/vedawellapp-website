"use client";

import { useEffect } from "react";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Admin Page Error]", error);
    }, [error]);

    return (
        <div className="py-10 px-6">
            <div className="max-w-2xl mx-auto">
                <div className="bg-card border border-red-500/30 rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Admin Page Error</h2>
                    <p className="text-muted mb-4">The admin dashboard encountered an error while loading.</p>

                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="font-mono text-sm text-red-800 dark:text-red-300 break-all">
                            {error.message || "Unknown error"}
                        </p>
                        {error.digest && (
                            <p className="font-mono text-xs text-red-600 mt-2">Digest: {error.digest}</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={reset}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
                        >
                            Try Again
                        </button>
                        <a
                            href="/guardian/dashboard"
                            className="px-4 py-2 border border-border rounded-lg hover:bg-muted/10 transition-colors font-semibold"
                        >
                            Back to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
