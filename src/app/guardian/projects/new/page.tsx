"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BuildTypeSelector from "@/components/guardian/BuildTypeSelector";
import PhoneVerificationGate from "@/components/guardian/PhoneVerificationGate";
import australianData from "@/data/australian-build-workflows.json";

type WorkflowsType = typeof australianData.workflows;
type NewBuildType = WorkflowsType["new_build"];
type StateWorkflow = NewBuildType[keyof NewBuildType] & { stages?: Array<{ id?: string; name: string; checklist?: string[]; certificates?: string[] }> };

export default function NewProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [emailVerified, setEmailVerified] = useState<boolean | null>(null); // null = loading
    const [resendingEmail, setResendingEmail] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    // Check email verification on mount (admins + Pro users skip)
    useEffect(() => {
        const checkEmail = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/guardian/login?returnTo=/guardian/projects/new");
                return;
            }

            // Admins, Pro users, and users with admin override skip email verification
            const { data: profile } = await supabase
                .from("profiles")
                .select("is_admin, subscription_tier, email_verified_override")
                .eq("id", user.id)
                .single();

            if (profile?.is_admin || profile?.subscription_tier === "guardian_pro" || profile?.email_verified_override) {
                setEmailVerified(true);
                return;
            }

            setEmailVerified(!!user.email_confirmed_at);
        };
        checkEmail();
    }, [router]);

    const handleResendVerification = useCallback(async () => {
        setResendingEmail(true);
        setResendSuccess(false);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) return;
            const { error: resendError } = await supabase.auth.resend({
                type: "signup",
                email: user.email,
            });
            if (resendError) throw resendError;
            setResendSuccess(true);
        } catch {
            setError("Failed to resend verification email. Please try again.");
        } finally {
            setResendingEmail(false);
        }
    }, []);

    const recheckEmail = useCallback(async () => {
        const supabase = createClient();
        // Refresh the session to get updated email_confirmed_at
        await supabase.auth.refreshSession();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
            setEmailVerified(true);
        } else {
            setError("Email not yet verified. Please check your inbox and click the confirmation link.");
        }
    }, []);

    const [formData, setFormData] = useState({
        name: "",
        builder_name: "",
        builder_license_number: "",
        builder_abn: "",
        hbcf_policy_number: "",
        insurance_expiry_date: "",
        contract_value: "",
        address: "",
        start_date: "",
        contract_signed_date: "",
        build_category: "",
        state: "NSW",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleBuildTypeSelect = (category: string, state: string) => {
        setFormData({
            ...formData,
            build_category: category,
            state: state,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("You must be logged in to create a project.");
            setLoading(false);
            return;
        }

        try {
            // Check free tier limits
            const { data: profile, error: profileErr } = await supabase
                .from("profiles")
                .select("subscription_tier, is_admin, trial_ends_at")
                .eq("id", user.id)
                .single();

            if (profileErr || !profile) {
                setError("Could not load your profile. Please try again.");
                setLoading(false);
                return;
            }

            const tier = profile.subscription_tier || "free";
            const isAdmin = profile?.is_admin === true;
            const trialActive = tier === "trial" && profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
            const hasPro = tier === "guardian_pro" || isAdmin || trialActive;

            if (!hasPro) {
                const { count, error: countErr } = await supabase
                    .from("projects")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", user.id);

                if (countErr) {
                    setError("Could not check project limits. Please try again.");
                    setLoading(false);
                    return;
                }

                if ((count || 0) >= 1) {
                    setError("Free plan allows 1 project. Upgrade to Guardian Pro for unlimited projects.");
                    setLoading(false);
                    return;
                }
            }

            // 1. Create Project with enhanced fields
            const { data: projectData, error: insertError } = await supabase
                .from("projects")
                .insert([
                    {
                        user_id: user.id,
                        name: formData.name,
                        builder_name: formData.builder_name,
                        builder_license_number: formData.builder_license_number || null,
                        builder_abn: formData.builder_abn || null,
                        hbcf_policy_number: formData.hbcf_policy_number || null,
                        insurance_expiry_date: formData.insurance_expiry_date || null,
                        contract_value: Math.max(0, parseFloat(formData.contract_value) || 0),
                        address: formData.address,
                        start_date: formData.start_date || null,
                        contract_signed_date: formData.contract_signed_date || null,
                        status: "planning",
                        state: formData.state || "NSW",
                        build_category: formData.build_category || "new_build",
                    },
                ])
                .select()
                .single();

            if (insertError) throw insertError;
            if (!projectData) throw new Error("Failed to create project data.");

            const projectId = projectData.id;

            // 2. Get state-specific workflow data
            const buildCategory = formData.build_category || "new_build";
            const stateCode = formData.state || "NSW";

            // Get stages from workflow data
            const categoryWorkflows = australianData.workflows[buildCategory as keyof typeof australianData.workflows];
            const stateWorkflow = categoryWorkflows?.[stateCode as keyof typeof categoryWorkflows] as StateWorkflow | undefined;
            const stages = stateWorkflow?.stages || [];

            // 3. Seed stages and checklist items based on workflow
            for (const stageTemplate of stages) {
                const paymentPercent = (stageTemplate as any).paymentMilestone
                    ? parseFloat(((stageTemplate as any).paymentMilestone as string).match(/\d+/)?.[0] || "0")
                    : 0;

                const { data: stageData, error: stageError } = await supabase
                    .from("stages")
                    .insert({
                        project_id: projectId,
                        name: stageTemplate.name,
                        status: "pending",
                        payment_percentage: paymentPercent,
                    })
                    .select()
                    .single();

                if (stageError) {
                    console.error("Error creating stage:", stageError);
                    continue;
                }

                // If this stage has a checklist (like pre_plasterboard)
                const checklistItems = (stageTemplate as any).checklist || [];
                if (checklistItems.length > 0) {
                    const itemsToInsert = checklistItems.map((item: any) => ({
                        stage_id: stageData.id,
                        description: item.item,
                        is_completed: false,
                        is_critical: item.critical || false,
                        requires_photo: item.requiresPhoto || false,
                    }));

                    const { error: clErr } = await supabase.from("checklist_items").insert(itemsToInsert);
                    if (clErr) console.warn("Checklist insert failed:", clErr.message);
                } else {
                    // Default items for stages without explicit checklist
                    const defaultItems = (stageTemplate as any).inspections || [];
                    if (defaultItems.length > 0) {
                        const itemsToInsert = defaultItems.map((inspection: string) => ({
                            stage_id: stageData.id,
                            description: `Inspection: ${inspection}`,
                            is_completed: false,
                            is_critical: true,
                            requires_photo: true,
                        }));

                        const { error: clErr2 } = await supabase.from("checklist_items").insert(itemsToInsert);
                        if (clErr2) console.warn("Checklist insert failed:", clErr2.message);
                    }
                }

                // Seed certificates for this stage
                const certificates = (stageTemplate as any).certificates || [];
                for (const cert of certificates) {
                    const { error: certErr } = await supabase.from("certifications").insert({
                        project_id: projectId,
                        type: cert.toLowerCase().replace(/[^a-z]/g, "_").substring(0, 50),
                        status: "pending",
                        required_for_stage: stageData.id,
                    });
                    if (certErr) console.warn("Cert insert failed:", certErr.message);
                }

                // Seed payment milestone for this stage (if it has a payment)
                if (paymentPercent > 0) {
                    const contractVal = Math.max(0, parseFloat(formData.contract_value) || 0);
                    const certsForPayment = (stageTemplate as any).certificates || [];
                    const { error: payErr } = await supabase.from("payments").insert({
                        project_id: projectId,
                        stage_name: stageTemplate.name,
                        percentage: paymentPercent,
                        amount: Math.round((paymentPercent / 100) * contractVal),
                        status: "pending",
                        certificates_required: certsForPayment,
                    });
                    if (payErr) console.warn("Payment insert failed:", payErr.message);
                }
            }

            // Redirect to project detail page
            router.push(`/guardian/projects/${projectId}`);
            router.refresh();
        } catch (err: any) {
            console.error("Error creating project:", err);
            setError(err.message || "Failed to create project. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Navigation */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/guardian/dashboard" className="text-muted hover:text-foreground">
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 py-12 px-6">
                <div className="max-w-3xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
                        <p className="text-muted">
                            {emailVerified === false
                                ? "Verify your email address to get started"
                                : !phoneVerified
                                ? "Verify your phone number to get started"
                                : `Step ${step} of 2 — Start tracking your home construction journey.`}
                        </p>
                    </header>

                    {/* Email verification gate */}
                    {emailVerified === null && (
                        <div className="bg-card border border-border rounded-xl p-8 text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-muted">Checking verification status...</p>
                        </div>
                    )}

                    {emailVerified === false && (
                        <div className="bg-card border border-amber-500/30 rounded-xl p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold mb-2">Verify Your Email</h2>
                                <p className="text-muted mb-6 max-w-md mx-auto">
                                    We sent a verification link to your email address. Please click the link to confirm your account before creating a project.
                                </p>

                                {resendSuccess && (
                                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
                                        Verification email sent! Check your inbox (and spam folder).
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={recheckEmail}
                                        className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        I&apos;ve Verified — Continue
                                    </button>
                                    <button
                                        onClick={handleResendVerification}
                                        disabled={resendingEmail}
                                        className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted/10 transition-colors disabled:opacity-50"
                                    >
                                        {resendingEmail ? "Sending..." : "Resend Verification Email"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phone verification gate — must verify before creating project */}
                    {emailVerified === true && !phoneVerified && (
                        <PhoneVerificationGate onVerified={() => setPhoneVerified(true)} />
                    )}

                    {/* Progress — only show after both email + phone verification */}
                    {emailVerified === true && phoneVerified && <>
                    <div className="flex gap-2 mb-8">
                        <div className={`flex-1 h-2 rounded ${step >= 1 ? "bg-primary" : "bg-border"}`} />
                        <div className={`flex-1 h-2 rounded ${step >= 2 ? "bg-primary" : "bg-border"}`} />
                    </div>

                    <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">Select Build Type & State</h2>
                                <BuildTypeSelector
                                    onSelect={handleBuildTypeSelect}
                                    selectedCategory={formData.build_category}
                                    selectedState={formData.state}
                                />
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!formData.build_category}
                                        className="px-6 py-3 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
                                    >
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg">
                                    <span className="text-2xl">
                                        {australianData.buildCategories.find((c) => c.id === formData.build_category)?.icon}
                                    </span>
                                    <span className="font-bold">
                                        {australianData.buildCategories.find((c) => c.id === formData.build_category)?.name}
                                    </span>
                                    <span className="text-muted">in</span>
                                    <span className="font-bold">{formData.state}</span>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="ml-auto text-sm text-primary hover:underline"
                                    >
                                        Change
                                    </button>
                                </div>

                                {/* Project Name */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Project Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        placeholder="e.g. My Dream Home"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Builder Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Builder Name</label>
                                        <input
                                            type="text"
                                            name="builder_name"
                                            placeholder="e.g. Metricon"
                                            value={formData.builder_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Builder License */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Builder License # <span className="text-xs text-muted">(verify at Fair Trading)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="builder_license_number"
                                            placeholder="e.g. 123456C"
                                            value={formData.builder_license_number}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* HBCF Policy */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {formData.state === "NSW"
                                                ? "HBCF Policy #"
                                                : formData.state === "VIC"
                                                    ? "DBI Policy #"
                                                    : formData.state === "QLD"
                                                        ? "QBCC Insurance #"
                                                        : "Home Warranty Policy #"}
                                        </label>
                                        <input
                                            type="text"
                                            name="hbcf_policy_number"
                                            placeholder="Insurance policy number"
                                            value={formData.hbcf_policy_number}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Insurance Expiry */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Insurance Expiry Date</label>
                                        <input
                                            type="date"
                                            name="insurance_expiry_date"
                                            value={formData.insurance_expiry_date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* Contract Value */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Contract Value ($)</label>
                                    <input
                                        type="number"
                                        name="contract_value"
                                        placeholder="e.g. 450000"
                                        value={formData.contract_value}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Site Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="e.g. 123 Construction Road, Sydney"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Construction Start Date (Estimated)</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Contract Signed Date */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Contract Signed Date
                                        <span className="text-xs text-muted ml-1">(for cooling-off period tracking)</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="contract_signed_date"
                                        value={formData.contract_signed_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3 rounded-lg border border-border hover:bg-muted/10 transition-colors font-medium"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Creating Project..." : "Start Tracking Project"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Info Box */}
                    {step === 2 && (
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h4 className="font-bold text-amber-800 mb-2">⚠️ Before you start</h4>
                            <ul className="text-sm text-amber-700 space-y-1">
                                <li>• Get a copy of your builder&apos;s license and verify it online</li>
                                <li>• Request the Home Warranty Insurance certificate BEFORE signing</li>
                                <li>• Keep a copy of all contracts and variations</li>
                            </ul>
                        </div>
                    )}
                    </>}
                </div>
            </main>
        </div>
    );
}
