"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type View = "sign-in" | "sign-up" | "forgot-password";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [view, setView] = useState<View>("sign-in");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            window.location.href = "/guardian/dashboard";
        }

        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const supabase = createClient();

        // Sign up with email confirmation disabled (auto-confirm)
        // The Supabase project should have "Enable email confirmations" turned OFF
        // in Auth > Settings > Email, OR we pass emailRedirectTo to skip it.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Skip email confirmation — user is signed in immediately
                emailRedirectTo: `${window.location.origin}/guardian/dashboard`,
            },
        });

        if (error) {
            setMessage({ type: "error", text: error.message });
            setLoading(false);
            return;
        }

        // If the user was auto-confirmed (no email confirmation required),
        // they'll have a session immediately. Redirect to dashboard.
        if (data.session) {
            setMessage({ type: "success", text: "Account created! Redirecting..." });
            window.location.href = "/guardian/dashboard";
        } else {
            // If email confirmation IS enabled in Supabase settings,
            // auto-sign-in the user anyway (best effort)
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                // Supabase requires email confirmation — tell user nicely
                setMessage({
                    type: "success",
                    text: "Account created! You can now sign in.",
                });
                setView("sign-in");
            } else {
                window.location.href = "/guardian/dashboard";
            }
        }

        setLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/guardian/login`,
        });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({
                type: "success",
                text: "Password reset link sent! Check your email.",
            });
        }

        setLoading(false);
    };

    const getTitle = () => {
        switch (view) {
            case "sign-in": return "Welcome back";
            case "sign-up": return "Create your account";
            case "forgot-password": return "Reset your password";
        }
    };

    const getSubtitle = () => {
        switch (view) {
            case "sign-in": return "Sign in to access your HomeOwner Guardian dashboard";
            case "sign-up": return "Start protecting your home construction project";
            case "forgot-password": return "Enter your email and we'll send you a reset link";
        }
    };

    const getSubmitHandler = () => {
        switch (view) {
            case "sign-in": return handleSignIn;
            case "sign-up": return handleSignUp;
            case "forgot-password": return handleForgotPassword;
        }
    };

    const getButtonText = () => {
        if (loading) return "Loading...";
        switch (view) {
            case "sign-in": return "Sign In";
            case "sign-up": return "Create Account";
            case "forgot-password": return "Send Reset Link";
        }
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
                    <Link href="/guardian" className="text-muted hover:text-foreground">
                        ← Back to Guardian
                    </Link>
                </div>
            </nav>

            {/* Login Form */}
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="card">
                        <div className="text-center mb-8">
                            <span className="text-5xl block mb-4">🏠</span>
                            <h1 className="text-2xl font-bold">{getTitle()}</h1>
                            <p className="text-muted mt-2">{getSubtitle()}</p>
                        </div>

                        <form onSubmit={getSubmitHandler()} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            {/* Password field — hidden for forgot password */}
                            {view !== "forgot-password" && (
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                                        Password
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
                            )}

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
                                {getButtonText()}
                            </button>
                        </form>

                        <div className="mt-6 text-center space-y-3">
                            {/* Forgot password link — only on sign-in view */}
                            {view === "sign-in" && (
                                <button
                                    onClick={() => { setView("forgot-password"); setMessage(null); }}
                                    className="text-sm text-muted hover:text-primary hover:underline block w-full"
                                >
                                    Forgot your password?
                                </button>
                            )}

                            {/* Toggle between sign-in and sign-up */}
                            {view !== "forgot-password" && (
                                <button
                                    onClick={() => { setView(view === "sign-in" ? "sign-up" : "sign-in"); setMessage(null); }}
                                    className="text-primary hover:underline block w-full"
                                >
                                    {view === "sign-up"
                                        ? "Already have an account? Sign in"
                                        : "Don't have an account? Sign up"}
                                </button>
                            )}

                            {/* Back to sign-in from forgot password */}
                            {view === "forgot-password" && (
                                <button
                                    onClick={() => { setView("sign-in"); setMessage(null); }}
                                    className="text-primary hover:underline block w-full"
                                >
                                    ← Back to Sign In
                                </button>
                            )}

                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        const { loginAsDevUser } = await import("./actions");
                                        await loginAsDevUser();
                                    }}
                                    className="text-xs text-muted hover:text-foreground border border-dashed border-border px-3 py-2 rounded"
                                >
                                    🛠️ Dev Mode: Bypass Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
