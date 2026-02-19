"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BuildTypeSelector from "@/components/guardian/BuildTypeSelector";
import australianData from "@/data/australian-build-workflows.json";

type WorkflowsType = typeof australianData.workflows;
type NewBuildType = WorkflowsType["new_build"];
type StateWorkflow = NewBuildType[keyof NewBuildType];

export default function NewProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

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
                        contract_value: parseFloat(formData.contract_value) || 0,
                        address: formData.address,
                        start_date: formData.start_date || null,
                        status: "planning",
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
                const { data: stageData, error: stageError } = await supabase
                    .from("stages")
                    .insert({
                        project_id: projectId,
                        name: stageTemplate.name,
                        status: "pending",
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

                    await supabase.from("checklist_items").insert(itemsToInsert);
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

                        await supabase.from("checklist_items").insert(itemsToInsert);
                    }
                }

                // Seed certificates for this stage
                const certificates = (stageTemplate as any).certificates || [];
                for (const cert of certificates) {
                    await supabase.from("certifications").insert({
                        project_id: projectId,
                        type: cert.toLowerCase().replace(/[^a-z]/g, "_").substring(0, 20),
                        status: "pending",
                        required_for_stage: stageTemplate.id,
                    });
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
                        <p className="text-muted">Step {step} of 2 — Start tracking your home construction journey.</p>
                    </header>

                    {/* Progress */}
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
                                    <label className="block text-sm font-medium text-foreground mb-2">Start Date (Estimated)</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
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
                </div>
            </main>
        </div>
    );
}
