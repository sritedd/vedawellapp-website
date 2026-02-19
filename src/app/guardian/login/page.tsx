"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type View = "sign-in" | "sign-up" | "forgot-password";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("homeowner");
    const [showPassword, setShowPassword] = useState(false);
    const [view, setView] = useState<View>("sign-in");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

        // If auto-confirmed (no email confirmation), user has a session
        if (data.session) {
            // Update profile with phone (the trigger handles full_name and role)
            if (phone.trim()) {
                await supabase.from("profiles").update({
                    phone: phone.trim(),
                }).eq("id", data.user?.id);
            }
            setMessage({ type: "success", text: "Account created! Redirecting..." });
            window.location.href = "/guardian/dashboard";
        } else {
            // Fallback: try auto sign-in
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

    const strength = getPasswordStrength(password);

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
                                disabled={loading}
                                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
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
