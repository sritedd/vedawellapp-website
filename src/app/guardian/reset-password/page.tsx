"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [sessionReady, setSessionReady] = useState(false);

    useEffect(() => {
        // Supabase automatically picks up the recovery token from the URL hash
        // and sets the session. We just need to wait for it.
        const supabase = createClient();
        supabase.auth.onAuthStateChange((event: string) => {
            if (event === "PASSWORD_RECOVERY") {
                setSessionReady(true);
            }
        });

        // Also check if we already have a session (user might have clicked the link)
        supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
            if (data.session) {
                setSessionReady(true);
            }
        });
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }

        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "Password updated successfully! Redirecting..." });
            setTimeout(() => {
                window.location.href = "/guardian/dashboard";
            }, 1500);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
            {/* Navigation */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <Link href="/guardian/login" className="text-muted hover:text-foreground">
                        ← Back to Login
                    </Link>
                </div>
            </nav>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="card">
                        <div className="text-center mb-8">
                            <span className="text-5xl block mb-4">🔐</span>
                            <h1 className="text-2xl font-bold">Set New Password</h1>
                            <p className="text-muted mt-2">
                                Enter your new password below
                            </p>
                        </div>

                        {!sessionReady ? (
                            <div className="text-center py-8">
                                <div className="animate-spin text-4xl mb-4">⏳</div>
                                <p className="text-muted">Verifying your reset link...</p>
                                <p className="text-sm text-muted mt-2">
                                    If this takes too long,{" "}
                                    <Link href="/guardian/login" className="text-primary hover:underline">
                                        request a new reset link
                                    </Link>
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                                        New Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                {message && (
                                    <div
                                        className={`p-4 rounded-lg ${message.type === "error"
                                            ? "bg-danger/10 text-danger"
                                            : "bg-success/10 text-success"
                                            }`}
                                    >
                                        {message.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full disabled:opacity-50"
                                >
                                    {loading ? "Updating..." : "Update Password"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
