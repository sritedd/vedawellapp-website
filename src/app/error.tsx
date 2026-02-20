"use client";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <span className="text-5xl block mb-4">⚠️</span>
                <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                <p className="text-muted mb-6">
                    An unexpected error occurred. Please try again.
                </p>
                {process.env.NODE_ENV === "development" && error.message && (
                    <pre className="text-left text-xs bg-red-50 text-red-700 p-4 rounded-lg mb-6 overflow-auto max-h-32">
                        {error.message}
                    </pre>
                )}
                <button
                    onClick={reset}
                    className="btn-primary"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
