"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Document {
    id: string;
    project_id: string;
    type: string;
    name: string;
    file_url: string;
    uploaded_at: string;
}

interface DocumentVaultProps {
    projectId: string;
}

const DOCUMENT_TYPES = [
    { id: "contract", label: "Building Contract", icon: "📝", required: true },
    { id: "hbcf_certificate", label: "HBCF/Home Warranty Insurance", icon: "🛡️", required: true },
    { id: "builder_license", label: "Builder License Copy", icon: "🪪", required: true },
    { id: "soil_report", label: "Soil Test / Geotechnical Report", icon: "🧪", required: false },
    { id: "contour_survey", label: "Contour Survey", icon: "📐", required: false },
    { id: "engineering", label: "Structural Engineering Drawings", icon: "🏗️", required: false },
    { id: "basix", label: "BASIX Certificate", icon: "🌿", required: true },
    { id: "eicc", label: "EICC (Electrical Certificate)", icon: "⚡", required: false },
    { id: "plumbing", label: "Plumbing Certificate", icon: "🚿", required: false },
    { id: "waterproofing", label: "Waterproofing Certificate", icon: "💧", required: false },
    { id: "occupation_certificate", label: "Occupation Certificate (OC)", icon: "🏠", required: true },
    { id: "other", label: "Other Document", icon: "📄", required: false },
];

export default function DocumentVault({ projectId }: DocumentVaultProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedType, setSelectedType] = useState("contract");
    const [customName, setCustomName] = useState("");

    useEffect(() => {
        fetchDocuments();
    }, [projectId]);

    const fetchDocuments = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("documents")
            .select("*")
            .eq("project_id", projectId)
            .order("uploaded_at", { ascending: false });

        if (!error && data) {
            setDocuments(data);
        }
        setLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const supabase = createClient();

        try {
            // Upload to Supabase Storage
            const fileName = `${projectId}/${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("documents")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("documents")
                .getPublicUrl(fileName);

            // Save document record
            const docType = DOCUMENT_TYPES.find((t) => t.id === selectedType);
            const docName = selectedType === "other" && customName
                ? customName
                : docType?.label || file.name;

            const { error: insertError } = await supabase.from("documents").insert({
                project_id: projectId,
                type: selectedType,
                name: docName,
                file_url: urlData.publicUrl,
            });

            if (insertError) throw insertError;

            // Refresh documents
            fetchDocuments();
            setCustomName("");
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload document. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;

        const supabase = createClient();
        const { error } = await supabase
            .from("documents")
            .delete()
            .eq("id", docId);

        if (!error) {
            setDocuments(documents.filter((d) => d.id !== docId));
        }
    };

    // Calculate completion status
    const requiredDocs = DOCUMENT_TYPES.filter((t) => t.required);
    const uploadedRequired = requiredDocs.filter((t) =>
        documents.some((d) => d.type === t.id)
    );
    const completionPercent = Math.round(
        (uploadedRequired.length / requiredDocs.length) * 100
    );

    return (
        <div className="space-y-6">
            {/* Header with Progress */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">📁 Document Vault</h2>
                    <p className="text-muted-foreground">
                        Store and organize all your building documents in one place.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">
                        Required Documents: {uploadedRequired.length}/{requiredDocs.length}
                    </div>
                    <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${completionPercent === 100 ? "bg-green-500" : "bg-primary"
                                }`}
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div className="p-6 bg-card border border-border rounded-xl">
                <h3 className="font-bold mb-4">Upload New Document</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-4 py-3 rounded-lg border border-border bg-background"
                    >
                        {DOCUMENT_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.icon} {type.label} {type.required ? "*" : ""}
                            </option>
                        ))}
                    </select>

                    {selectedType === "other" && (
                        <input
                            type="text"
                            placeholder="Document name"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="px-4 py-3 rounded-lg border border-border bg-background flex-1"
                        />
                    )}

                    <label className="px-6 py-3 bg-primary text-white rounded-lg font-medium cursor-pointer hover:bg-primary/90 transition-colors text-center">
                        {uploading ? "Uploading..." : "📤 Choose File"}
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Accepted formats: PDF, JPG, PNG, DOC, DOCX. Max size: 10MB.
                </p>
            </div>

            {/* Documents by Category */}
            <div className="grid md:grid-cols-2 gap-4">
                {DOCUMENT_TYPES.map((type) => {
                    const typeDocs = documents.filter((d) => d.type === type.id);
                    const hasDoc = typeDocs.length > 0;

                    return (
                        <div
                            key={type.id}
                            className={`p-4 rounded-xl border ${hasDoc
                                    ? "border-green-200 bg-green-50"
                                    : type.required
                                        ? "border-orange-200 bg-orange-50"
                                        : "border-border bg-card"
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{type.icon}</span>
                                    <div>
                                        <h4 className="font-bold text-sm">{type.label}</h4>
                                        {type.required && !hasDoc && (
                                            <span className="text-xs text-orange-600">Required</span>
                                        )}
                                        {hasDoc && (
                                            <span className="text-xs text-green-600">✓ Uploaded</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {typeDocs.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {typeDocs.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-2 bg-white rounded-lg text-sm"
                                        >
                                            <a
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                📎 {doc.name}
                                            </a>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Warning if missing required */}
            {completionPercent < 100 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-bold text-amber-800 mb-2">
                        ⚠️ Missing Required Documents
                    </h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                        {requiredDocs
                            .filter((t) => !documents.some((d) => d.type === t.id))
                            .map((t) => (
                                <li key={t.id}>• {t.label}</li>
                            ))}
                    </ul>
                    <p className="text-xs text-amber-600 mt-2">
                        Keep all critical documents stored here for easy access during disputes.
                    </p>
                </div>
            )}
        </div>
    );
}
