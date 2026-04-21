"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TwoFactorSetup from "@/components/guardian/TwoFactorSetup";
import NotificationPreferences from "@/components/guardian/NotificationPreferences";
import { useToast } from "@/components/guardian/Toast";

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: string;
    created_at: string;
}

export default function ProfilePage() {
    const { toast } = useToast();
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

    // Data export & account deletion
    const [exporting, setExporting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const deleteInputRef = useRef<HTMLInputElement>(null);

    // MFA gate for account deletion
    const [deleteMfaEnabled, setDeleteMfaEnabled] = useState(false);
    const [deleteMfaCode, setDeleteMfaCode] = useState("");
    const [deleteMfaVerified, setDeleteMfaVerified] = useState(false);
    const [deleteMfaVerifying, setDeleteMfaVerifying] = useState(false);

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

        // Check if phone number changed — if so, reset identity verification
        const newPhone = phone.trim() || null;
        const currentPhone = profile?.phone || null;
        const phoneChanged = newPhone !== currentPhone;

        // Update profile (only safe fields — RLS blocks subscription_tier/is_admin changes)
        const profileUpdate: Record<string, unknown> = {
            full_name: fullName.trim(),
            phone: newPhone,
            role: role,
        };

        const { error: profileError } = await supabase
            .from("profiles")
            .update(profileUpdate)
            .eq("id", profile?.id);

        if (profileError) {
            setMessage({ type: "error", text: profileError.message });
            setSaving(false);
            return;
        }

        // If phone changed, reset identity verification via API (needs service-role to update identity_verified)
        if (phoneChanged && newPhone) {
            try {
                await fetch("/api/guardian/phone-verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "reset-for-phone-change" }),
                });
            } catch {
                // Non-blocking — verification will be required on next project creation
            }
        }

        // Also update auth user metadata
        const { error: authError } = await supabase.auth.updateUser({
            data: {
                full_name: fullName.trim(),
                phone: newPhone,
                role: role,
            },
        });

        if (authError) {
            setMessage({ type: "error", text: authError.message });
        } else {
            const suffix = phoneChanged && newPhone
                ? " Phone number changed — you'll need to re-verify your identity."
                : "";
            setMessage({ type: "success", text: `Profile updated successfully!${suffix}` });
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

    const handleExportData = async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/guardian/export-data");
            if (!res.ok) {
                throw new Error("Export failed");
            }
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `guardian-data-export-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            toast("Failed to export data. Please try again.", "error");
        } finally {
            setExporting(false);
        }
    };

    const checkDeleteMfa = async () => {
        const supabase = createClient();
        const { data } = await supabase.auth.mfa.listFactors();
        const verified = data?.totp?.find((f: { status: string }) => f.status === "verified");
        setDeleteMfaEnabled(!!verified);
        setDeleteMfaVerified(false);
        setDeleteMfaCode("");
    };

    const verifyDeleteMfaCode = async () => {
        if (deleteMfaCode.length !== 6) return;
        setDeleteMfaVerifying(true);
        setDeleteError(null);
        try {
            const res = await fetch("/api/guardian/verify-mfa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: deleteMfaCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setDeleteError(data.error || "Invalid code");
            } else {
                setDeleteMfaVerified(true);
            }
        } catch {
            setDeleteError("MFA verification failed");
        } finally {
            setDeleteMfaVerifying(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmEmail !== profile?.email) {
            setDeleteError("Email does not match your account email.");
            return;
        }
        if (deleteMfaEnabled && !deleteMfaVerified) {
            setDeleteError("Please verify your authenticator code first.");
            return;
        }
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch("/api/guardian/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmEmail: deleteConfirmEmail }),
            });
            const data = await res.json();
            if (!res.ok) {
                setDeleteError(data.error || "Deletion failed");
                setDeleting(false);
                return;
            }
            // Redirect to login with message
            window.location.href = "/guardian/login?deleted=1";
        } catch {
            setDeleteError("Failed to delete account. Please try again.");
            setDeleting(false);
        }
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

                {/* Security — Two-Factor Authentication */}
                <div className="card mb-6">
                    <TwoFactorSetup />
                </div>

                {/* Notification Preferences */}
                <div className="card mb-6">
                    <NotificationPreferences />
                </div>

                {/* Your Data */}
                <div className="card mb-6">
                    <h3 className="font-semibold mb-2">Your Data</h3>
                    <p className="text-sm text-muted mb-4">
                        Download a copy of all your data or permanently delete your account.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleExportData}
                            disabled={exporting}
                            className="btn-primary disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                            {exporting && (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {exporting ? "Preparing..." : "Download My Data"}
                        </button>
                        <button
                            onClick={() => {
                                setShowDeleteModal(true);
                                setDeleteConfirmEmail("");
                                setDeleteError(null);
                                checkDeleteMfa();
                                setTimeout(() => deleteInputRef.current?.focus(), 100);
                            }}
                            className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm hover:bg-danger/10 transition-colors"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Delete Account Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-danger mb-2">Delete Account</h3>
                            <p className="text-sm text-muted mb-4">
                                This action is <strong>permanent and irreversible</strong>. All your projects,
                                defects, documents, photos, and account data will be permanently deleted.
                            </p>
                            <p className="text-sm mb-4">
                                We recommend downloading your data first. To confirm, type your email address below:
                            </p>
                            <p className="text-xs text-muted mb-2 font-mono">{profile?.email}</p>
                            <input
                                ref={deleteInputRef}
                                type="email"
                                value={deleteConfirmEmail}
                                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-danger mb-4"
                                placeholder="Type your email to confirm"
                            />
                            {/* MFA verification step */}
                            {deleteMfaEnabled && !deleteMfaVerified && (
                                <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg space-y-3 mb-4">
                                    <p className="text-sm font-medium text-yellow-700">
                                        Enter your authenticator code to proceed
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={deleteMfaCode}
                                            onChange={(e) => setDeleteMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            placeholder="000000"
                                            maxLength={6}
                                            className="flex-1 px-3 py-2 text-sm rounded border border-border bg-background text-center tracking-widest font-mono"
                                        />
                                        <button
                                            onClick={verifyDeleteMfaCode}
                                            disabled={deleteMfaCode.length !== 6 || deleteMfaVerifying}
                                            className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
                                        >
                                            {deleteMfaVerifying ? "..." : "Verify"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {deleteMfaEnabled && deleteMfaVerified && (
                                <p className="text-xs text-green-600 font-medium mb-4">2FA verified</p>
                            )}

                            {deleteError && (
                                <div className="p-3 rounded-lg text-sm bg-danger/10 text-danger border border-danger/20 mb-4">
                                    {deleteError}
                                </div>
                            )}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                    className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleting || deleteConfirmEmail !== profile?.email || (deleteMfaEnabled && !deleteMfaVerified)}
                                    className="px-4 py-2 rounded-lg bg-danger text-white text-sm hover:bg-danger/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {deleting && (
                                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    )}
                                    {deleting ? "Deleting..." : "Permanently Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sign Out */}
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
