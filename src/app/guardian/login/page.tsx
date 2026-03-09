"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getRateLimitSecondsRemaining, recordFailedAttempt, resetRateLimit } from "@/lib/security/rate-limit";

type View = "sign-in" | "sign-up" | "forgot-password";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const initialView = searchParams.get("view") === "sign-up" ? "sign-up" : "sign-in";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("homeowner");
    const [showPassword, setShowPassword] = useState(false);
    const [view, setView] = useState<View>(initialView);
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Auto-redirect if already logged in
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
            if (data.user) {
                window.location.href = "/guardian/dashboard";
            } else {
                setCheckingAuth(false);
            }
        });
    }, []);

    // Count down rate limit timer
    useEffect(() => {
        if (rateLimitSeconds <= 0) return;
        const timer = setInterval(() => {
            const remaining = getRateLimitSecondsRemaining();
            setRateLimitSeconds(remaining);
        }, 1000);
        return () => clearInterval(timer);
    }, [rateLimitSeconds]);

    const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
        if (pw.length === 0) return { label: "", color: "", width: "0%" };
        if (pw.length < 6) return { label: "Too short", color: "bg-red-500", width: "20%" };
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { label: "Weak", color: "bg-orange-500", width: "40%" };
        if (score <= 3) return { label: "Good", color: "bg-yellow-500", width: "70%" };
        return { label: "Strong", color: "bg-green-500", width: "100%" };
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();

        const remaining = getRateLimitSecondsRemaining();
        if (remaining > 0) {
            setRateLimitSeconds(remaining);
            setMessage({ type: "error", text: `Too many failed attempts. Please wait ${remaining}s before trying again.` });
            return;
        }

        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            const waitSeconds = recordFailedAttempt();
            if (waitSeconds > 0) {
                setRateLimitSeconds(waitSeconds);
                setMessage({ type: "error", text: `Too many failed attempts. Please wait ${waitSeconds}s before trying again.` });
            } else {
                setMessage({ type: "error", text: error.message });
            }
        } else {
            resetRateLimit();
            window.location.href = "/guardian/dashboard";
        }

        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!fullName.trim()) {
            setMessage({ type: "error", text: "Please enter your full name." });
            setLoading(false);
            return;
        }

        const supabase = createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/guardian/dashboard`,
                data: {
                    full_name: fullName.trim(),
                    phone: phone.trim() || null,
                    role: role,
                },
            },
        });

        if (error) {
            setMessage({ type: "error", text: error.message });
            setLoading(false);
            return;
        }

        if (data.session) {
            if (phone.trim()) {
                await supabase.from("profiles").update({
                    phone: phone.trim(),
                }).eq("id", data.user?.id);
            }
            setMessage({ type: "success", text: "Account created! Redirecting..." });
            window.location.href = "/guardian/dashboard";
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
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
            redirectTo: `${window.location.origin}/guardian/reset-password`,
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

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setMessage(null);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/guardian/dashboard`,
            },
        });
        if (error) {
            setMessage({ type: "error", text: error.message });
            setGoogleLoading(false);
        }
    };

    const strength = getPasswordStrength(password);

    // Show loading while checking auth
    if (checkingAuth) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <span className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="py-12 px-6">
            <main className="flex items-center justify-center">
                <div className="w-full max-w-md">
                    {/* Back link */}
                    <Link href="/guardian" className="inline-flex items-center gap-2 text-muted hover:text-primary mb-8 transition-colors">
                        ← Back to Guardian
                    </Link>

                    <div className="card">
                        <div className="text-center mb-8">
                            <span className="text-5xl block mb-4">🏠</span>
                            <h1 className="text-2xl font-bold">{getTitle()}</h1>
                            <p className="text-muted mt-2">{getSubtitle()}</p>
                        </div>

                        {/* Google OAuth */}
                        {view !== "forgot-password" && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={googleLoading || loading}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted/10 transition-colors font-medium disabled:opacity-50"
                                >
                                    {googleLoading ? (
                                        <span className="inline-block w-5 h-5 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    )}
                                    {view === "sign-up" ? "Sign up with Google" : "Sign in with Google"}
                                </button>

                                <div className="flex items-center gap-3 my-2">
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted">or continue with email</span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>
                            </>
                        )}

                        <form onSubmit={getSubmitHandler()} className="space-y-4">
                            {/* Full Name — signup only */}
                            {view === "sign-up" && (
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                                        Full Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="John Smith"
                                        required
                                    />
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-2">
                                    Email <span className="text-danger">*</span>
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

                            {/* Phone — signup only */}
                            {view === "sign-up" && (
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                        Phone <span className="text-muted text-xs">(optional)</span>
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="+61 400 000 000"
                                    />
                                </div>
                            )}

                            {/* Role — signup only */}
                            {view === "sign-up" && (
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium mb-2">
                                        I am a
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: "homeowner", label: "🏠 Homeowner", desc: "Building or renovating" },
                                            { value: "builder", label: "🔨 Builder", desc: "Managing projects" },
                                            { value: "certifier", label: "📋 Certifier", desc: "Inspecting & signing off" },
                                        ].map((r) => (
                                            <button
                                                key={r.value}
                                                type="button"
                                                onClick={() => setRole(r.value)}
                                                className={`p-3 rounded-lg border text-center transition-all ${role === r.value
                                                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                                                        : "border-border hover:border-primary/50"
                                                    }`}
                                            >
                                                <div className="text-lg">{r.label.split(" ")[0]}</div>
                                                <div className="text-xs font-medium mt-1">{r.label.split(" ")[1]}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Password — hidden for forgot password */}
                            {view !== "forgot-password" && (
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                                        Password <span className="text-danger">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-sm"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? "🙈" : "👁️"}
                                        </button>
                                    </div>

                                    {/* Password strength — signup only */}
                                    {view === "sign-up" && password.length > 0 && (
                                        <div className="mt-2">
                                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                                                    style={{ width: strength.width }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted mt-1">{strength.label}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {message && (
                                <div
                                    className={`p-4 rounded-lg text-sm ${message.type === "error"
                                        ? "bg-danger/10 text-danger border border-danger/20"
                                        : "bg-success/10 text-success border border-success/20"
                                        }`}
                                >
                                    {message.type === "error" ? "❌ " : "✅ "}
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || rateLimitSeconds > 0}
                                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {rateLimitSeconds > 0 ? `Wait ${rateLimitSeconds}s...` : getButtonText()}
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

                        {/* Trust indicators */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <div className="flex items-center justify-center gap-6 text-xs text-muted">
                                <span>🔒 Encrypted</span>
                                <span>🛡️ Secure Auth</span>
                                <span>📱 Free to Use</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
