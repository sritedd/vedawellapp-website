"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: string;
    created_at: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("homeowner");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Password change
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            window.location.href = "/guardian/login";
            return;
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error || !data) {
            // Profile might not exist yet — create from auth user
            setProfile({
                id: user.id,
                email: user.email || "",
                full_name: user.user_metadata?.full_name || null,
                phone: user.user_metadata?.phone || null,
                role: user.user_metadata?.role || "homeowner",
                created_at: user.created_at,
            });
            setFullName(user.user_metadata?.full_name || "");
            setPhone(user.user_metadata?.phone || "");
            setRole(user.user_metadata?.role || "homeowner");
        } else {
            setProfile(data);
            setFullName(data.full_name || "");
            setPhone(data.phone || "");
            setRole(data.role || "homeowner");
        }

        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const supabase = createClient();

        // Update profile table
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                full_name: fullName.trim(),
                phone: phone.trim() || null,
                role: role,
            })
            .eq("id", profile?.id);

        if (profileError) {
            setMessage({ type: "error", text: profileError.message });
            setSaving(false);
            return;
        }

        // Also update auth user metadata
        const { error: authError } = await supabase.auth.updateUser({
            data: {
                full_name: fullName.trim(),
                phone: phone.trim() || null,
                role: role,
            },
        });

        if (authError) {
            setMessage({ type: "error", text: authError.message });
        } else {
            setMessage({ type: "success", text: "Profile updated successfully!" });
            // Refresh profile
            await loadProfile();
        }

        setSaving(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: "Passwords do not match." });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }

        setChangingPassword(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setPasswordMessage({ type: "error", text: error.message });
        } else {
            setPasswordMessage({ type: "success", text: "Password updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordSection(false);
        }

        setChangingPassword(false);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/guardian/login";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background">
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-muted">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
            {/* Navigation */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/guardian/dashboard" className="flex items-center gap-2 text-xl font-bold">
                        <span>🏠</span>
                        <span>Guardian</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/guardian/dashboard" className="text-muted hover:text-foreground text-sm">
                            ← Dashboard
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-danger hover:text-danger/80"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
                <h1 className="text-2xl font-bold mb-2">My Profile</h1>
                <p className="text-muted mb-8">Manage your account details and preferences</p>

                {/* Profile Info Card */}
                <div className="card mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                            {fullName ? fullName.charAt(0).toUpperCase() : "👤"}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{fullName || "No name set"}</h2>
                            <p className="text-sm text-muted">{profile?.email}</p>
                            <p className="text-xs text-muted mt-1">
                                Member since {new Date(profile?.created_at || "").toLocaleDateString("en-AU", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                                Full Name
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

                        {/* Email (read-only) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email <span className="text-xs text-muted">(cannot be changed)</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={profile?.email || ""}
                                disabled
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-muted cursor-not-allowed"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                Phone <span className="text-xs text-muted">(optional)</span>
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

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Role</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: "homeowner", label: "🏠 Homeowner" },
                                    { value: "builder", label: "🔨 Builder" },
                                    { value: "certifier", label: "📋 Certifier" },
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
                                        <div className="text-xs font-medium mt-1">{r.label.split(" ").slice(1).join(" ")}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

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
                            disabled={saving}
                            className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving && (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </div>

                {/* Change Password Card */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">Password</h3>
                            <p className="text-sm text-muted">Update your password</p>
                        </div>
                        <button
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                            className="text-sm text-primary hover:underline"
                        >
                            {showPasswordSection ? "Cancel" : "Change Password"}
                        </button>
                    </div>

                    {showPasswordSection && (
                        <form onSubmit={handlePasswordChange} className="mt-4 space-y-4 pt-4 border-t border-border">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmNewPassword" className="block text-sm font-medium mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmNewPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {passwordMessage && (
                                <div
                                    className={`p-4 rounded-lg text-sm ${passwordMessage.type === "error"
                                        ? "bg-danger/10 text-danger border border-danger/20"
                                        : "bg-success/10 text-success border border-success/20"
                                        }`}
                                >
                                    {passwordMessage.type === "error" ? "❌ " : "✅ "}
                                    {passwordMessage.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={changingPassword}
                                className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {changingPassword && (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {changingPassword ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="card border-danger/20">
                    <h3 className="font-semibold text-danger mb-2">Sign Out</h3>
                    <p className="text-sm text-muted mb-4">
                        Sign out of your account on this device.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm hover:bg-danger/10 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </main>
        </div>
    );
}
