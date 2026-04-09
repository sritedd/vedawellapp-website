"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteProject } from "@/app/guardian/actions";
import type { Project } from "@/types/guardian";

interface ProjectSettingsProps {
    project: Project;
    onProjectUpdated: (updated: Project) => void;
}

export default function ProjectSettings({ project, onProjectUpdated }: ProjectSettingsProps) {
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // MFA gate for destructive actions
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaVerified, setMfaVerified] = useState(false);
    const [mfaVerifying, setMfaVerifying] = useState(false);

    const [form, setForm] = useState({
        name: project.name || "",
        address: project.address || "",
        builder_name: project.builder_name || "",
        builder_license_number: project.builder_license_number || "",
        builder_abn: project.builder_abn || "",
        hbcf_policy_number: project.hbcf_policy_number || "",
        insurance_expiry_date: project.insurance_expiry_date || "",
        contract_value: project.contract_value?.toString() || "",
        start_date: project.start_date?.split("T")[0] || "",
        status: project.status || "active",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setMessage({ type: "error", text: "Not authenticated" });
            setSaving(false);
            return;
        }

        const updates: Record<string, any> = {
            name: form.name,
            address: form.address,
            builder_name: form.builder_name,
            builder_license_number: form.builder_license_number || null,
            builder_abn: form.builder_abn || null,
            hbcf_policy_number: form.hbcf_policy_number || null,
            insurance_expiry_date: form.insurance_expiry_date || null,
            contract_value: parseFloat(form.contract_value) || 0,
            start_date: form.start_date || null,
            status: form.status,
        };

        const { error } = await supabase
            .from("projects")
            .update(updates)
            .eq("id", project.id)
            .eq("user_id", user.id);

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "Project updated successfully!" });
            onProjectUpdated({ ...project, ...updates });
        }

        setSaving(false);
    };

    // Check if user has MFA enabled when delete confirm is shown
    const checkMfa = async () => {
        const supabase = createClient();
        const { data } = await supabase.auth.mfa.listFactors();
        const verified = data?.totp?.find((f: { status: string }) => f.status === "verified");
        setMfaEnabled(!!verified);
        setMfaVerified(false);
        setMfaCode("");
    };

    const verifyMfaCode = async () => {
        if (mfaCode.length !== 6) return;
        setMfaVerifying(true);
        setMessage(null);

        try {
            const res = await fetch("/api/guardian/verify-mfa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: mfaCode }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: "error", text: data.error || "Invalid code" });
            } else {
                setMfaVerified(true);
            }
        } catch {
            setMessage({ type: "error", text: "Verification failed" });
        } finally {
            setMfaVerifying(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== project.name) return;
        if (mfaEnabled && !mfaVerified) return;

        setDeleting(true);
        setMessage(null);

        // Use server action — enforces MFA server-side (checks aal2 if TOTP enabled)
        // and handles full cascade delete (storage, all related tables, project)
        const result = await deleteProject(project.id);

        if (result?.error) {
            setMessage({ type: "error", text: result.error });
            setDeleting(false);
        }
        // On success, the server action redirects to /guardian/projects
    };

    return (
        <div className="space-y-8">
            {/* Edit Project */}
            <div className="card">
                <h2 className="text-xl font-bold mb-6">Project Details</h2>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === "error"
                        ? "bg-danger/10 text-danger border border-danger/20"
                        : "bg-success/10 text-success border border-success/20"
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2">Project Name *</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={form.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Site Address</label>
                        <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Builder Name</label>
                            <input
                                type="text"
                                name="builder_name"
                                value={form.builder_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Builder License #</label>
                            <input
                                type="text"
                                name="builder_license_number"
                                value={form.builder_license_number}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Builder ABN</label>
                            <input
                                type="text"
                                name="builder_abn"
                                value={form.builder_abn}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">HBCF / Warranty Policy #</label>
                            <input
                                type="text"
                                name="hbcf_policy_number"
                                value={form.hbcf_policy_number}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Insurance Expiry</label>
                            <input
                                type="date"
                                name="insurance_expiry_date"
                                value={form.insurance_expiry_date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Contract Value ($)</label>
                            <input
                                type="number"
                                name="contract_value"
                                value={form.contract_value}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Danger Zone */}
            <div className="card border-danger/30">
                <h2 className="text-xl font-bold text-danger mb-4">Danger Zone</h2>
                <p className="text-muted text-sm mb-4">
                    Deleting a project permanently removes all associated data including variations, defects,
                    checklists, certifications, and documents. This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => { setShowDeleteConfirm(true); checkMfa(); }}
                        className="px-4 py-2 border border-danger text-danger rounded-lg font-medium hover:bg-danger/10 transition-colors"
                    >
                        Delete This Project
                    </button>
                ) : (
                    <div className="p-4 bg-danger/5 border border-danger/20 rounded-lg space-y-4">
                        <p className="text-sm font-medium">
                            Type <strong>{project.name}</strong> to confirm deletion:
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type project name to confirm"
                            className="w-full px-4 py-3 rounded-lg border border-danger/30 bg-background focus:outline-none focus:ring-2 focus:ring-danger"
                        />

                        {/* MFA verification step */}
                        {mfaEnabled && !mfaVerified && (
                            <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg space-y-3">
                                <p className="text-sm font-medium text-yellow-700">
                                    Enter your authenticator code to proceed
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="flex-1 px-3 py-2 text-sm rounded border border-border bg-background text-center tracking-widest font-mono"
                                    />
                                    <button
                                        onClick={verifyMfaCode}
                                        disabled={mfaCode.length !== 6 || mfaVerifying}
                                        className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
                                    >
                                        {mfaVerifying ? "..." : "Verify"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {mfaEnabled && mfaVerified && (
                            <p className="text-xs text-green-600 font-medium">2FA verified</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={deleteConfirmText !== project.name || deleting || (mfaEnabled && !mfaVerified)}
                                className="px-4 py-2 bg-danger text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                {deleting ? "Deleting..." : "Permanently Delete Project"}
                            </button>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); setMfaCode(""); setMfaVerified(false); }}
                                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted/10"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
